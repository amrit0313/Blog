import express from "express";

import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from "./follow.controller";

import { authenticateToken } from "../auth/auth.middleware";

const router = express.Router();

// Public routes
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

// Protected routes
router.post("/:userId/follow", authenticateToken, followUser);
router.delete("/:userId/follow", authenticateToken, unfollowUser);
router.get("/:userId/follow-status", authenticateToken, getFollowStatus);

export default router;
