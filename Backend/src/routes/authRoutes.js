import express from "express";
import { register, login, getCurrentUser } from "../controllers/authController.js";
import { authenticateToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", login);

// Protected routes
router.get("/me", authenticateToken, getCurrentUser);

// Admin-only route for creating users with specific roles
router.post("/register", authenticateToken, checkRole('IT Admin'), register);

export default router;
