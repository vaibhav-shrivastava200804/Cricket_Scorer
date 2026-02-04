import express from "express";
import { endInnings, startMatch, selectNewBatsman } from "../controllers/innings.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();
router.post("/start",protect(["ADMIN"]),startMatch);
router.post("/end",protect(["ADMIN"]),endInnings);
router.post("/select-new-batsman",protect(["ADMIN"]),selectNewBatsman);
export default router;
