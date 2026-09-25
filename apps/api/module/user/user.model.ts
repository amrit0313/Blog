import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
passwordHash: {
  type: String,
  required: true,
  select: false,
  validate: {
    validator: function (value: string) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
    },
    message:
      "Password must be at least 8 characters and contain uppercase, lowercase, and a number.",
  },
},

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
