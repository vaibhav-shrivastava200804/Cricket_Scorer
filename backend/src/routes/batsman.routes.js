import express from "express";
import { selectNewBatsman } from "../controllers/batsman.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router=express.Router();
router.post("/new-batsman",protect(["ADMIN"]),selectNewBatsman);
export default router;