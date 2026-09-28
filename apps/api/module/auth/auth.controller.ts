import { User } from "../user/user.model";
import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getEnvConfig } from "../../config/env.config";
import { sendResetMail } from "../../services/email.service";
import crypto from "node:crypto";
import { nextTick } from "node:process";

const addUser = async (req: Request, res: Response) => {
  try {
    const { JWT_SECRET, REFRESH_SECRET } = getEnvConfig();
    if (!JWT_SECRET || !REFRESH_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Fill up credentials" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json("User already exists");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1m" });
    const refresh = jwt.sign(user._id, REFRESH_SECRET, { expiresIn: "7d" });
    res.cookie("refreshToken", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(201)
      .json({ message: "user created successfully", payload, token });
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

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const userid = payload.id
    console.log("1", payload);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1m" });
    const refresh = jwt.sign({userid}, REFRESH_SECRET, { expiresIn: "7d" });
    console.log("2", payload);

    res.cookie("refreshToken", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    user.save();

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
    const user = await User.findOne({ email });
    if (!user?.hashedToken)
      return res.status(400).json({ message: "Token not found" });
    const isVerified = await bcrypt.compare(token, user.hashedToken);
    if (!isVerified) {
      return res.status(400).json({ message: "Token didn't match" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    await user.save();
    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const { JWT_SECRET, REFRESH_SECRET } = getEnvConfig();

  if (!refreshToken) {
    return res.status(401).json({ message: "Token not provided" });
  }

  if (!REFRESH_SECRET) {
    return res.status(401).json({ message: "Server error" });
  }

  const payload = jwt.verify(refreshToken, REFRESH_SECRET);
  const user = await User.findById(payload);
  if (!user) return res.status(401).json({ message: "User not found" });
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "1m" });
  const refresh = jwt.sign(userData.id, REFRESH_SECRET, { expiresIn: "7d" });
  res.cookie("refreshToken", refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    token,
  });
};

export {
  addUser,
  loginUser,
  getCurrentUser,
  forgetPassword,
  resetPassword,
  refresh,
};
