import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "unpublished", "submitted", "rejected"],
      default: "draft",
    },
    image: { type: String }
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Blog", BlogSchema);
