import expres from "express";
import { listUsers, detailUser, editUser, deleteUser } from "./user.controller";
import { authenticateToken } from "../auth/auth.middleware";

const router = expres.Router();

router.get("", listUsers);
router.get("/:id", detailUser);
router.patch("", authenticateToken, editUser);
router.delete("", authenticateToken, deleteUser);

export default router;
