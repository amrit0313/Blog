import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    hashedTokenExpiresAt: {
      type: Date,
      select: false,
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

userSchema.virtual("profile", {
  ref: "Profile",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const User = mongoose.model("User", userSchema);
