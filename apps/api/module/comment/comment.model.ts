// comment.model.ts
import mongoose, { Schema } from "mongoose";

const replySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const commentSchema = new Schema(
  {
    blog: {
         type: Schema.Types.ObjectId, 
         ref: "Blog", 
         required: true, 
         index: true
         },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    content: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 2000 
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

commentSchema.index({ blog: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);