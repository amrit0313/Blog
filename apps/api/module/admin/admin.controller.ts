import Blog from "../blog/blog.model";
import { Request, Response } from "express";
import { User } from "../user/user.model";

const deleteBlogs = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err:any) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const addAnotherAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }
    user.role = "admin";
    await user.save();
    return res
      .status(200)
      .json({ message: "User promoted to admin successfully", user });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export { deleteBlogs, addAnotherAdmin };
