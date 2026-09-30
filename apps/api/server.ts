import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./module/auth/auth.route";
import blogRoutes from "./module/blog/blog.route";
import profileRoutes from "./module/profile/profile.route";
import adminRoutes from "./module/admin/admin.route";
import categoryRoutes from "./module/categories/category.routes";
import userRoutes from "./module/user/user.route";
import { connectDB } from "./config/db";
import errorHandler from "./services/errorHandler";
import { UPLOADS_DIR, usesLocalStorage } from "./storage";

import path from "path";
const PORT = 5000;

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://blog-ncc19.vercel.app",
      "http://localhost:3000",
      "https://blog-kt2b18nqp-ncc19.vercel.app/",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
if (usesLocalStorage) {
  app.use("/uploads", express.static(UPLOADS_DIR));
}
app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);

app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/category", categoryRoutes);

app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
