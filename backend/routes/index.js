import express from "express";

import { getAllTeamMembers
 } from "../controllers/team.js";

const router = express.Router();

router.get('/team-members', getAllTeamMembers);

export default router;