import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index:true
    },
    name: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
   
    hashedToken: {
      type: "string",
    },
    verificationTokenHash: {
      type: String,
      select: false,
    },
    verificationTokenExpiresAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
