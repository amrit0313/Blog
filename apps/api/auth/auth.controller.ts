import { User } from "../user/user.model";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getEnvConfig } from "../config/env.config";

export const addUser = async (req: Request, res: Response) => {
  try {
    const { JWT_SECRET } = getEnvConfig();
    if (!JWT_SECRET) {
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
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { JWT_SECRET } = getEnvConfig();
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Fill up the credentials" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isVerified = bcrypt.compare(password, user?.passwordHash);
    if (!isVerified) {
      return res.status(400).json({ message: "Credentials doesn't match" });
    }
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET);
    return res.status(200).json({ payload, token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
