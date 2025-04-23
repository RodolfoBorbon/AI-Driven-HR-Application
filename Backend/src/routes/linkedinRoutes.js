import express from "express";
import {
  initiateAuth,
  handleCallback,
  postJobToLinkedIn,
} from "../controllers/linkedinController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// OAuth routes (public)
router.get("/auth", initiateAuth);
router.get("/callback", handleCallback);

// Protected routes
router.use(authenticateToken);
router.post("/jobs/:jobId/post", postJobToLinkedIn);

export default router;
