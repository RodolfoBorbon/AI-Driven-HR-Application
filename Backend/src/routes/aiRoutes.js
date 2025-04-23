import express from "express";
import { autoCompleteJobDescription } from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
// router.use(authenticateToken);

router.post("/auto-complete", autoCompleteJobDescription);

export default router;
