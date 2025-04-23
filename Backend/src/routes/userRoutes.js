import express from "express";
import { getAllUsers, createUser, deleteUser } from "../controllers/userController.js";
import { authenticateToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes - only IT Admin can access
router.use(authenticateToken);
router.use(checkRole('IT Admin'));

router.get("/", getAllUsers);
router.post("/", createUser);
router.delete("/:id", deleteUser);

export default router;
