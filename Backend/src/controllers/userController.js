import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger.js";

// Get all users (for IT Admin)
export const getAllUsers = async (req, res) => {
  try {
    // Ensure requesting user is an IT Admin
    if (req.user.role !== 'IT Admin') {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    // Get all users except passwords
    const users = await User.find().select('-password');
    
    // Transform MongoDB _id to id for consistent frontend usage
    const transformedUsers = users.map(user => ({
      id: user._id.toString(), // Ensure ID is a string
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));
    
    res.json({
      success: true,
      data: transformedUsers
    });
  } catch (error) {
    logger.error("Error fetching users", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to retrieve users",
      message: error.message
    });
  }
};

// Create a new user (for IT Admin)
export const createUser = async (req, res) => {
  try {
    // Ensure requesting user is an IT Admin
    if (req.user.role !== 'IT Admin') {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        error: "User already exists with this email or username" 
      });
    }
    
    // Validate role
    const validRoles = ['IT Admin', 'HR Manager', 'HR Assistant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid role specified" 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });
    
    if (newUser) {
      // Return user without password
      const userData = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      };
      
      logger.info("New user created by admin", { 
        adminId: req.user.id, 
        newUserId: newUser._id,
        newUserRole: newUser.role 
      });
      
      res.status(201).json({
        success: true,
        data: userData
      });
    }
  } catch (error) {
    logger.error("Error creating user", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: error.message
    });
  }
};

// Delete user (for IT Admin)
export const deleteUser = async (req, res) => {
  try {
    // Log incoming delete request
    logger.info("Delete user request received", { 
      adminId: req.user.id, 
      targetUserId: req.params.id 
    });
    
    // Ensure requesting user is an IT Admin
    if (req.user.role !== 'IT Admin') {
      logger.warn("Unauthorized delete attempt", { 
        userId: req.user.id, 
        userRole: req.user.role,
        targetId: req.params.id
      });
      
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized: Admin access required" 
      });
    }
    
    let { id } = req.params;
    
    // Clean up the ID - trim whitespace
    id = id.toString().trim();
    
    // Log the format of the ID for debugging
    logger.info("User ID format check", {
      id,
      idType: typeof id,
      idLength: id.length,
      isHexString: /^[0-9a-fA-F]+$/.test(id)
    });
    
    // Use a more flexible approach to ID validation
    // Try to find the user with the given ID first, before strict validation
    let userToDelete;
    try {
      userToDelete = await User.findById(id);
    } catch (findError) {
      logger.error("Error finding user by ID", { 
        id, 
        error: findError.message 
      });
    }
    
    // If not found and ID doesn't look like a MongoDB ID, return error
    if (!userToDelete && !/^[0-9a-fA-F]{24}$/.test(id)) {
      logger.error("Invalid ID format and user not found", { 
        id,
        length: id.length
      });
      
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format or user not found",
        providedId: id
      });
    }
    
    if (!userToDelete) {
      logger.warn("Delete attempt on non-existent user", { 
        adminId: req.user.id, 
        targetId: id 
      });
      
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Prevent deletion of IT Admin users
    if (userToDelete.role === 'IT Admin') {
      logger.warn("Attempt to delete IT Admin user", { 
        adminId: req.user.id, 
        targetId: id,
        targetUsername: userToDelete.username
      });
      
      return res.status(400).json({ 
        success: false, 
        error: "IT Admin users cannot be deleted for security reasons" 
      });
    }
    
    // Delete the user - use findByIdAndDelete which works with the _id
    await User.findByIdAndDelete(userToDelete._id);
    
    logger.info("User deleted successfully", { 
      adminId: req.user.id, 
      deletedUserId: id,
      deletedUsername: userToDelete.username
    });
    
    // Enhance response to include more information
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        id: userToDelete._id,
        username: userToDelete.username,
        email: userToDelete.email
      }
    });
  } catch (error) {
    logger.error("Error deleting user", { 
      error: error.message,
      stack: error.stack,
      userId: req.params.id
    });
    
    return res.status(500).json({
      success: false,
      error: "Failed to delete user",
      message: error.message
    });
  }
};
