import Profile from "./profile.model";
import { Request, Response } from "express";
const createOrUpdateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const avatar = req.file?.filename;

    const profile = await Profile.findOneAndUpdate(
      { user: userId }, // Filter: find profile by user ID
      {
        $set: {
          ...req.body,
          ...(avatar && { avatar }),
        },
      }, // Update: data from the request body
      {
        new: true, // Returns the newly updated/created document
        upsert: true, // Creates the document if it doesn't exist
        runValidators: true, // Ensures Mongoose schema rules are checked
        setDefaultsOnInsert: true, // Applies default values if creating a new doc
      },
    );

    return res.status(200).json({
      message: "Profile saved successfully",
      profile,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    console.log(req?.user);
    const profile = await Profile.findOne({ user }).populate(
      "user",
      "id name email",
    );
    if (!profile) {
      return res.status(400).json({ message: "profile doesn't exist" });
    }
    return res
      .status(200)
      .json({ message: "profile retrieve successfully", profile });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export { createOrUpdateProfile, getProfile };
