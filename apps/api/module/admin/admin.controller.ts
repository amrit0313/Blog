import Blog from "../blog/blog.model";
import { Request, Response } from "express";
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";

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


const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete an admin user" });
    }
    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === "admin" ? "admin" : "user",
    });

    return res.status(201).json({
      message: "User created successfully",
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const verifyBlog = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    if (blog.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted blogs can be verified" });
    }
    blog.status = "published";
    await blog.save();
    return res.status(200).json({ message: "Blog verified and published", blog });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const rejectBlog = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    if (blog.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted blogs can be rejected" });
    }
    blog.status = "rejected";
    await blog.save();
    return res.status(200).json({ message: "Blog rejected", blog });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export { deleteBlogs, addAnotherAdmin, deleteUser, createUser, verifyBlog, rejectBlog };

