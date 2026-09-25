import express from 'express'
const router = express.Router();
import {addUser, loginUser} from "./auth.controller"

router.post("/register", addUser);
router.post("/login", loginUser);

export default router;