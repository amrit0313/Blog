import { Request, Response } from "express";
import { User } from "./user.model";

/**
 * Fields that can be changed on a user account.
 */
interface UpdateUserBody {
  name?: string;
  email?: string;
}

/**
 * Retrieves users, optionally filtered by name search and role.
 *
 * @param {Request} req - Request containing optional `search` and `role` query parameters.
 * @param {Response} res - Express response used to return the matching users.
 * @returns {Promise<Response>} A 200 response with users, or a 500 response when retrieval fails.
 *
 * @example
 * GET /api/users?search=ada&role=user
 */
const listUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const filter: Record<string, unknown> = {};
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role : "";

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = new RegExp(escapedSearch, "i");
    }

    if (role === "admin" || role === "user") {
      filter.role = role;
    }

    const users = await User.find(filter);

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

/**
 * Retrieves a single user by ID.
 *
 * @param {Request} req - Request containing the user ID in `req.params.id`.
 * @param {Response} res - Express response used to return the requested user.
 * @returns {Promise<Response>} A 200 response with the user, or a 400/404/500 response.
 *
 * @example
 * GET /api/users/665f1a2b3c4d5e6f78901234
 */
const detailUser = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ message: "User not specified" });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Successful", user });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

/**
 * Updates the authenticated user's name and email.
 *
 * @param {Request} req - Authenticated request containing optional `name` and `email` body fields.
 * @param {Response} res - Express response used to return the updated user.
 * @returns {Promise<Response>} A 200 response with the updated user, or a 404/500 response.
 *
 * @example
 * PATCH /api/users/me
 * { "name": "Ada Lovelace", "email": "ada@example.com" }
 */
const editUser = async (req: Request, res: Response): Promise<Response> => {
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

/**
 * Deletes the authenticated user's account.
 *
 * @param {Request} req - Authenticated request containing the current user's ID.
 * @param {Response} res - Express response used to report the deletion result.
 * @returns {Promise<Response>} A 200 response when deleted, or a 400/500 response.
 *
 * @example
 * DELETE /api/users/me
 */
const deleteUser = async (req: Request, res: Response): Promise<Response> => {

  try {
    const id = req.user?.id;
    const deleteUser = await User.findByIdAndDelete(id);
    if (deleteUser){
        return res.status(200).json({ message: "User deleted successfully" });

  }return res.status(400).json({ message: "Couldn't delete user " });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { listUsers, detailUser, editUser, deleteUser };
