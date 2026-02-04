import express from "express";
import { selectOpeners } from "../controllers/opening.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/select", protect(["ADMIN"]), selectOpeners);

export default router;