import express from "express";
import { scoreBall } from "../controllers/scoring.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.post("/ball", protect(["ADMIN"]),scoreBall);

export default router;