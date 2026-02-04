import express from "express";
import { startNextOver } from "../controllers/over.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router=express.Router();

router.post("/next", protect(["ADMIN"]), startNextOver);

export default router;