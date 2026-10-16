import express from "express";

import { SearchAll } from "./search.controller";

const router = express.Router();

router.get("", SearchAll);

export default router;