import { Request, Response } from "express";
import { User } from "./user.model";
interface UpdateUserBody {
  name?: string;
  email?: string;
}

const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

const detailUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ message: "User not specified" });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Sucessful", user });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

const editUser = async (req: Request, res: Response) => {
  try {
    const userId = req?.user?.id;
    const { name, email } = req.body;

    const updateData: UpdateUserBody = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      message: "Updated Successfully",
      updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  console.log(req.user);

  try {
    const id = req.user?.id;
    const deleteUser = await User.findByIdAndDelete(id);
    if (deleteUser){
        return res.status(200).json({ message: "User deleted successfully" });

  }return res.status(400).json({ message: "Couldn't delete user outif" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { listUsers, detailUser, editUser, deleteUser };
