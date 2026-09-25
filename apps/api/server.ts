import express from "express";
import cors from "cors";
import authRoutes from "./module/auth/auth.route";
import blogRoutes from "./module/blog/blog.route";
import { Response } from "express";
import { connectDB } from "./config/db";

const app = express();
const PORT = 5000;
app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);

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
