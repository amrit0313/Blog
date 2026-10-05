import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    image: {
      key: String, // for delete/replace
      url: String, // for display
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) => [
        ...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
      ],
    },
  },
  {
    timestamps: true,
  },
);
BlogSchema.index({ tags: 1 });

export default mongoose.model("Blog", BlogSchema);
