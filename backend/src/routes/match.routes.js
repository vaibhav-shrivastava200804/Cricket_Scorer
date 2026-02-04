import express from "express";
import {
  createTournament,createTeam,addPlayer,createMatch
} from "../controllers/match.controller.js";
import {protect} from "../middleware/auth.middleware.js";

const router= express.Router();
router.post("/tournament", protect(["ADMIN"]),createTournament);
router.post("/team", protect(["ADMIN"]), createTeam);
router.post("/player", protect(["ADMIN"]), addPlayer);
router.post("/create", protect(["ADMIN"]), createMatch);

export default router;