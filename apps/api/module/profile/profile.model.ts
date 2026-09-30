import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    bio: {
      type: String,
      maxlength: 250,
    },
    avatar: {
      key: String,
      url: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
  },
);
export default mongoose.model("Profile", ProfileSchema);
