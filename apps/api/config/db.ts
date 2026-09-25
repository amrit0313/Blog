import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/blog";

export const connectDB = async (): Promise<void> => {
	await mongoose.connect(MONGO_URI);
	console.log("Connected to MongoDB");
};
