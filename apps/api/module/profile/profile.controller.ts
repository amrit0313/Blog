import Profile from "./profile.model";
import { User } from "../user/user.model";
import { Request, Response, NextFunction } from "express";
import { storage } from "../../storage";
import mongoose from "mongoose";
import Blog from "../blog/blog.model";

const ALLOWED_SOCIAL = ["instagram", "facebook", "website"] as const;

/**
 * Creates or updates the authenticated user's profile and optional avatar.
 * @param {Request} req - Authenticated request containing profile fields in the body and an optional avatar file.
 * @param {Response} res - Express response used to return the saved profile.
 * @param {NextFunction} next - Passes unexpected storage or database errors to the error middleware.
 * @returns {Promise<Response|void>} A 200 response with the saved profile, or a validation/conflict response.
 * @example
 * PATCH /api/profile
 * Authorization: Bearer <access-token>
 * { "bio": "Writer and reader", "socialLinks": { "website": "https://example.com" } }
 */
const createOrUpdateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let uploaded: { key: string; url: string } | null = null;

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Whitelist: only these fields can ever be set by the client
    const { name, email, bio, socialLinks } = req.body;

    // 1. Validate BEFORE uploading
    if (bio !== undefined && (typeof bio !== "string" || bio.length > 250)) {
      return res
        .status(400)
        .json({ message: "Bio must be a string up to 250 characters" });
    }

    // Need the current avatar so we can delete it after a successful replace
    const existing = await Profile.findOne({ user: userId }).select("avatar");

    // 2. Upload (the split: local disk in dev, Cloudinary in prod)
    if (req.file) {
      uploaded = await storage.upload(req.file, { folder: "profiles" });
    }

    // 3. Update user fields
    if (name !== undefined || email !== undefined) {
      const userUpdate: { name?: string; email?: string } = {};
      if (name !== undefined) userUpdate.name = name;
      if (email !== undefined) userUpdate.email = email;
      await User.findByIdAndUpdate(
        userId,
        { $set: userUpdate },
        { runValidators: true },
      );
    }

    // 4. Build the profile update from known fields only
    const update: Record<string, unknown> = {};
    if (bio !== undefined) update.bio = bio;
    for (const k of ALLOWED_SOCIAL) {
      if (typeof socialLinks?.[k] === "string")
        update[`socialLinks.${k}`] = socialLinks[k];
    }
    if (uploaded) update.avatar = uploaded;

    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: update, $setOnInsert: { user: userId } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    // 5. Delete the old avatar only after everything succeeded
    if (uploaded && existing?.avatar?.key) {
      await storage.delete(existing.avatar.key).catch(console.error);
    }

    return res
      .status(200)
      .json({ message: "Profile saved successfully", profile });
  } catch (error: any) {
    // 6. Remove the orphaned upload if a later step failed
    if (uploaded) await storage.delete(uploaded.key).catch(console.error);

    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    next(error);
  }
};

/**
 * Retrieves the authenticated user's profile with basic user details.
 *
 * @param {Request} req - Authenticated request containing the current user's identity.
 * @param {Response} res - Express response used to return the profile.
 * @returns {Promise<Response>} A 200 response with the profile, or an error response when it is unavailable.
 *
 * @example
 * GET /api/profile
 * Authorization: Bearer <access-token>
 */
const getProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = req.user?.id;

    const profile = await Profile.findOne({ user })
      .populate("user", "id name email")
      .populate({
        path: "savedBlogs",
        select: "title slug image status createdAt author category",
        populate: [
          { path: "author", select: "_id name email" },
          { path: "category", select: "_id title" },
        ],
      });
    if (!profile) {
      return res.status(400).json({ message: "profile doesn't exist" });
    }
    return res
      .status(200)
      .json({ message: "profile retrieve successfully", profile });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const saveBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { blogId } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blogExists = await Blog.exists({ _id: blogId, status: "published" });
    if (!blogExists) return res.status(404).json({ message: "Blog not found" });

    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      {
        $addToSet: { savedBlogs: blogId },
        $setOnInsert: { user: userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate({
      path: "savedBlogs",
      select: "title slug image status createdAt author category",
      populate: [
        { path: "author", select: "_id name email" },
        { path: "category", select: "_id title" },
      ],
    });

    return res.status(200).json({ message: "Blog saved", profile });
  } catch (error) {
    next(error);
  }
};

const removeSavedBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { blogId } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $pull: { savedBlogs: blogId } },
      { new: true },
    ).populate({
      path: "savedBlogs",
      select: "title slug image status createdAt author category",
      populate: [
        { path: "author", select: "_id name email" },
        { path: "category", select: "_id title" },
      ],
    });

    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.status(200).json({ message: "Blog removed from saved blogs", profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a public profile by its associated user ID.
 *
 * @param {Request} req - Request containing the target user ID in `req.params.userId`.
 * @param {Response} res - Express response used to return the public profile.
 * @returns {Promise<Response>} A 200 response with the profile, or a 404/500 response.
 *
 * @example
 * GET /api/profile/665f1a2b3c4d5e6f78901234
 */
const getPublicProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ user: userId })
      .select("-savedBlogs")
      .populate("user", "id name email");
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json({ message: "Profile retrieved", profile });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createOrUpdateProfile,
  getProfile,
  getPublicProfile,
  saveBlog,
  removeSavedBlog,
};
