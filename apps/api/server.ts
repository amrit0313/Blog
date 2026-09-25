import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.route";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
