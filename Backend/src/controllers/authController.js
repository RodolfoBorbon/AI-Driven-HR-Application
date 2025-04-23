import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { logger } from "../config/logger.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user exists with more specific error messages
    const userExistsByEmail = await User.findOne({ email });
    if (userExistsByEmail) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    
    const userExistsByUsername = await User.findOne({ username });
    if (userExistsByUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with role (default to HR Assistant if not provided)
    // Only allow setting role if the request is coming from an admin
    const requestingUserId = req.user?.id;
    let userRole = 'HR Assistant';
    
    if (requestingUserId) {
      const requestingUser = await User.findById(requestingUserId);
      if (requestingUser?.role === 'IT Admin' && role) {
        userRole = role;
      }
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: userRole
    });

    if (user) {
      logger.info("New user registered", { email, role: userRole });
      res.status(201).json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    }
  } catch (error) {
    logger.error("Registration error", { error: error.message });
    res.status(500).json({ message: "Failed to register user" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token - include role in the token payload
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    logger.info("User logged in", { email, role: user.role });
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    res.status(500).json({ message: "Failed to log in" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by the authenticateToken middleware
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    logger.info("User data retrieved", { userId });
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error("Error retrieving user data", { error: error.message });
    res.status(500).json({ message: "Failed to retrieve user data" });
  }
};
