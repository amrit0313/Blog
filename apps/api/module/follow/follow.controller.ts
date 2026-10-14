import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../user/user.model";
import Follow from "./follow";



interface PublicUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  avatar?: string;
}

class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const parseIntOr = (value: unknown, fallback: number): number =>
  typeof value === "string" ? Number.parseInt(value, 10) || fallback : fallback;

const getPagination = (query: Request["query"]) => {
  const page = Math.max(1, parseIntOr(query.page, 1));
  const limit = Math.min(50, Math.max(1, parseIntOr(query.limit, 20)));
  return { page, limit };
};

// Follow a user
/** 
* @param {Request} req - Request object of express, has userid in user(the one who follows) and in param(the one who's followed)
* @param {reponse} res - response object of express
*/
export const followUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const followerId = req.user!.id; // set by auth middleware
  const followingId = req.params.userId;

  if (!mongoose.isValidObjectId(followingId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (followerId === followingId) {
    return res.status(400).json({
      message: "You cannot follow yourself",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const users = await User.find({
        _id: { $in: [followerId, followingId] },
      })
        .select("_id")
        .session(session);

      if (users.length !== 2) {
        throw new HttpError("User not found", 404);
      }

      const result = await Follow.updateOne(
        { follower: followerId, following: followingId },
        {
          $setOnInsert: {
            follower: followerId,
            following: followingId,
          },
        },
        { upsert: true, session },
      );

      if (result.upsertedCount === 1) {
        await User.updateOne(
          { _id: followerId },
          { $inc: { followingCount: 1 } },
          { session },
        );

        await User.updateOne(
          { _id: followingId },
          { $inc: { followersCount: 1 } },
          { session },
        );
      }
    });

    return res.status(200).json({
      message: "Follow successful",
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return res.status(404).json({ message: error.message });
    }

    if (isDuplicateKeyError(error)) {
      return res.status(200).json({
        message: "Already following this user",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  } finally {
    await session.endSession();
  }
};

// Unfollow a user
/** 
* @param {Request} req - Request object of express, has userid in user(the one who unfollows) and in param(the one who's unfollowed)
* @param {reponse} res - response object of express
*/
export const unfollowUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const followerId = req.user!.id;
  const followingId = req.params.userId;

  if (!mongoose.isValidObjectId(followingId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (followerId === followingId) {
    return res.status(400).json({
      message: "Invalid follow relationship",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const result = await Follow.deleteOne(
        { follower: followerId, following: followingId },
        { session },
      );

      if (result.deletedCount === 1) {
        await User.updateOne(
          { _id: followerId },
          { $inc: { followingCount: -1 } },
          { session },
        );

        await User.updateOne(
          { _id: followingId },
          { $inc: { followersCount: -1 } },
          { session },
        );
      }
    });

    return res.status(200).json({
      message: "Unfollow successful",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  } finally {
    await session.endSession();
  }
};

// Get a user's followers
export const getFollowers = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { page, limit } = getPagination(req.query);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("followersCount").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follows = await Follow.find({ following: userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate<{ follower: PublicUser | null }>("follower", "username avatar")
      .lean();

    return res.status(200).json({
      count: user.followersCount,
      page,
      limit,
      followers: follows.map((follow: any) => follow.follower).filter(Boolean),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch followers",
    });
  }
};

// Get accounts a user follows
/** 
* @param {Request} req - Request object of express, has userid in req.params and page, limit in req.query
* @param {reponse} res - response object of express
*/
export const getFollowing = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { page, limit } = getPagination(req.query);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("followingCount").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follows = await Follow.find({ follower: userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate<{ following: PublicUser | null }>(
        "following",
        "username avatar",
      )
      .lean();

    return res.status(200).json({
      count: user.followingCount,
      page,
      limit,
      following: follows.map((follow: any) => follow.following).filter(Boolean),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch following",
    });
  }
};

// Check if the logged-in user follows another user
/** 
* @param {Request} req - Request object of express, has userid in req.user and another user in req.params
* @param {reponse} res - response object of express
*/
export const getFollowStatus = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.userId;

    if (!mongoose.isValidObjectId(followingId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const isFollowing = await Follow.exists({
      follower: followerId,
      following: followingId,
    });

    return res.status(200).json({
      isFollowing: Boolean(isFollowing),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to check follow status",
    });
  }
};
