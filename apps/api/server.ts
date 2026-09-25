import express from "express";
import cors from "cors";
import authRoutes from "./module/auth/auth.route";
import userRoutes from "./module/user/user.route";
import { connectDB } from "./config/db";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

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
