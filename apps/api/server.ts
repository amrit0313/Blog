import express from "express";
import cors from "cors";
import authRoutes from "./module/auth/auth.route";
import blogRoutes from "./module/blog/blog.route";
import profileRoutes from "./module/profile/profile.route";
import adminRoutes from "./module/admin/admin.route";
import categoryRoutes from "./module/categories/category.routes";
import { connectDB } from "./config/db";
import errorHandler from "./services/errorHandler"

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true })); 
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/category",categoryRoutes)



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
