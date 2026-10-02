import { CookieOptions } from "express";
import { User } from "../user/user.model";
import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getEnvConfig } from "../../config/env.config";
import {
  sendResetMail,
  sendVerificationMail,
} from "../../services/email.service";
import crypto from "node:crypto";

const isProd = process.env.NODE_ENV === "production";
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const addUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Fill up credentials" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json("User already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
      name,
      email,
      passwordHash,
      verificationTokenHash,
      verificationTokenExpiresAt: new Date(Date.now() + 1 * 60 * 1000),
    });

    const emailResult = await sendVerificationMail(
      email,
      name,
      verificationToken,
    );
    if (!emailResult.success) {
      await user.deleteOne();
      return res
        .status(502)
        .json({ message: "Unable to send verification email" });
    }

    return res.status(201).json({
      message: "Account created. Check your email to verify your account.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await User.findOne({
      verificationTokenHash,
      verificationTokenExpiresAt: { $gt: new Date() },
    }).select("+verificationTokenHash +verificationTokenExpiresAt");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Verification link is invalid or expired" });
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { JWT_SECRET, REFRESH_SECRET } = getEnvConfig();
    if (!JWT_SECRET || !REFRESH_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Fill up the credentials" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) return res.status(400).json({ message: "User not found" });

    const isVerified = await bcrypt.compare(password, user.passwordHash);

    if (!isVerified) {
      return res.status(400).json({ message: "Credentials doesn't match" });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1m" });
    const refresh = jwt.sign({ userId: user._id.toString() }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("refreshToken", refresh, refreshCookieOptions);

    return res
      .status(200)
      .json({ message: "Logged in successfully", payload, token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCurrentUser = (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).json({ message: "unauthorized" });
    return res.status(200).json({ message: "current user fetched", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "No email provided" });
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({ message: "If user exists, reset link was sent" });
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);
    user.hashedToken = hashedToken;
    user.hashedTokenExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await user.save();

    sendResetMail(email, user.name, token);
    return res.status(200).json({
      message: "If user exists, reset link has been successfully sent!",
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { password, token, email } = req.body;
    if (!password || !token || !email) {
      return res
        .status(400)
        .json({ message: "Necessary data wasn't provided" });
    }
    const user = await User.findOne({ email }).select(
      "+hashedToken +hashedTokenExpiresAt",
    );
    if (!user || !user?.hashedToken)
      return res.status(400).json({ message: "No request" });
    if (!user.hashedTokenExpiresAt) {
      return res.status(400).json({ message: " No token provided" });
    }
    if (Date.now() > user.hashedTokenExpiresAt.getTime()) {
      return res.status(400).json({ message: "expired token" });
    }
    const isVerified = await bcrypt.compare(token, user.hashedToken);
    if (!isVerified) {
      return res.status(400).json({ message: "Token didn't match" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.hashedToken = undefined;
    user.hashedTokenExpiresAt = undefined;
    await user.save();
    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { JWT_SECRET, REFRESH_SECRET } = getEnvConfig();

    if (!refreshToken)
      return res.status(401).json({ message: "Token not provided" });
    if (!JWT_SECRET || !REFRESH_SECRET)
      return res.status(500).json({ message: "Server error" });

    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as {
      userId: string;
    };
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "1m" });
    const newRefresh = jwt.sign(
      { userId: user._id.toString() },
      REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("refreshToken", newRefresh, refreshCookieOptions);
    return res.json({ token });
  } catch {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
};

export {
  addUser,
  verifyEmail,
  loginUser,
  getCurrentUser,
  forgetPassword,
  resetPassword,
  refresh,
};
