import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
     createdBy:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        default: null
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Category", CategorySchema);
