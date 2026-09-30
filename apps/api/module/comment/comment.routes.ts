import express from "express";
import { addReply, createComment, deleteComment, deleteReply, listComments } from "./comment.controller";
import { authenticateToken } from "../auth/auth.middleware";

const router = express.Router({ mergeParams: true });

router.get("/",  listComments);
router.post("/", authenticateToken, createComment);
router.post("/:commentId/replies", authenticateToken, addReply);
router.delete("/:commentId", authenticateToken, deleteComment);
router.delete("/:commentId/replies/:replyId", authenticateToken, deleteReply);

export default router;




