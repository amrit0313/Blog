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
const VERIFICATION_TTL_MS = 30 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates an account or refreshes an existing unverified account, then sends
 * an email verification link.
 *
 * @param {Request} req - Express request containing `name`, `email`, and `password` in the body.
 * @param {Response} res - Express response used to return the account status.
 * @returns {Promise<Response>} `201` with a verification message, or an error response.
 *
 * @example
 * POST /api/auth/register
 * { "name": "Ada Lovelace", "email": "ada@example.com", "password": "password123" }
 */
const addUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Fill up credentials" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (password.length < 8 || password.length > 72) {
      return res
        .status(400)
        .json({ message: "Password must be 8 to 72 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing?.isVerified) {
      return res.status(409).json({ message: "User already exists" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + VERIFICATION_TTL_MS,
    );
    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    if (existing) {
      // Unverified account: refresh credentials and token
      existing.name = name;
      existing.passwordHash = passwordHash;
      existing.verificationTokenHash = verificationTokenHash;
      existing.verificationTokenExpiresAt = verificationTokenExpiresAt;
      user = await existing.save();
    } else {
      try {
        user = await User.create({
          name,
          email,
          passwordHash,
          verificationTokenHash,
          verificationTokenExpiresAt,
        });
      } catch (err: any) {
        if (err.code === 11000) {
          return res.status(409).json({ message: "User already exists" });
        }
        throw err;
      }
    }

    const emailResult = await sendVerificationMail(
      email,
      name,
      verificationToken,
    );
    if (!emailResult.success) {
      // Only delete if we just created it; never destroy an existing account
      if (!existing) await user.deleteOne();
      return res.status(502).json({
        message: "Unable to send verification email. Please try again.",
      });
    }

    return res.status(201).json({
      message: "Check your email to verify your account.",
    });
  } catch (error) {
    console.error("addUser failed:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Verifies a user's email address using the token from the verification link.
 *
 * @param {Request} req - Express request containing the verification `token` in the body.
 * @param {Response} res - Express response used to return the verification status.
 * @returns {Promise<Response>} `200` when the email is verified, or an error response.
 *
 * @example
 * POST /api/auth/verify-email
 * { "token": "verification-token-from-email" }
 */
const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
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
      return res.status(400).json({ message: "No user or token expired" });
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

/**
 * Authenticates a verified user and issues access and refresh tokens.
 *
 * @param {Request} req - Express request containing `email` and `password` in the body.
 * @param {Response} res - Express response that receives the access token and refresh cookie.
 * @returns {Promise<Response>} `200` with the user payload and access token, or an error response.
 *
 * @example
 * POST /api/auth/login
 * { "email": "ada@example.com", "password": "password123" }
 */
const loginUser = async (req: Request, res: Response): Promise<Response> => {
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

/**
 * Returns the authenticated user's data from the request context.
 *
 * @param {Request} req - Express request populated by `authenticateToken`.
 * @param {Response} res - Express response used to return the current user.
 * @returns {Response} `200` with the authenticated user, or `400` when no user is present.
 *
 * @example
 * POST /api/auth/me
 * Authorization: Bearer <access-token>
 */
const getCurrentUser =(req: Request, res: Response):any => {
  try {
    const user = req.user;
    if (!user) return res.status(400).json({ message: "unauthorized" });
    return res.status(200).json({ message: "current user fetched", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Sends a password-reset email without revealing whether an account exists.
 *
 * @param {Request} req - Express request containing the account `email` in the body.
 * @param {Response} res - Express response used to return a generic reset status.
 * @param {NextFunction} next - Express error handler for unexpected failures.
 * @returns {Promise<Response | void>} `200` with a generic reset message or delegates errors.
 *
 * @example
 * POST /api/auth/forgot-password
 * { "email": "ada@example.com" }
 */
const forgetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
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
    user.hashedTokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await user.save();

    sendResetMail(email, user.name, token);
    return res.status(200).json({
      message: "If user exists, reset link has been successfully sent!",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Validates a password-reset token and updates the user's password.
 *
 * @param {Request} req - Express request containing `email`, `token`, and `password` in the body.
 * @param {Response} res - Express response used to return the reset status.
 * @param {NextFunction} next - Express error handler for unexpected failures.
 * @returns {Promise<Response | void>} `200` when the password is updated or delegates errors.
 *
 * @example
 * POST /api/auth/reset-password
 * { "email": "ada@example.com", "token": "reset-token", "password": "newPassword123" }
 */
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
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

/**
 * Exchanges a valid refresh cookie for a new access and refresh token pair.
 *
 * @param {Request} req - Express request containing the `refreshToken` cookie.
 * @param {Response} res - Express response that receives the new access token and refresh cookie.
 * @returns {Promise<Response>} `200` with a new access token, or an authentication error response.
 *
 * @example
 * POST /api/auth/refresh
 * Cookie: refreshToken=<refresh-token>
 */
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
