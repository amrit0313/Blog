import Profile from "./profile.model";
import { User } from "../user/user.model";
import { Request, Response, NextFunction } from "express";
import { storage } from "../../storage";

const ALLOWED_SOCIAL = ["instagram", "facebook", "website"] as const;

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
const getProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;

    const profile = await Profile.findOne({ user }).populate(
      "user",
      "id name email",
    );
    console.log(profile);
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

const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ user: userId }).populate(
      "user",
      "id name email",
    );
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res
      .status(200)
      .json({ message: "Profile retrieved", profile });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export { createOrUpdateProfile, getProfile, getPublicProfile };
