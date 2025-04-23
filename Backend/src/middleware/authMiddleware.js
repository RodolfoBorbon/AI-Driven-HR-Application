import jwt from "jsonwebtoken";
import { logger } from "../config/logger.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    logger.warn("Access attempt without token", { path: req.path });
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    logger.warn("Invalid token provided", { path: req.path });
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check for specific roles
export const checkRole = (roles) => {
  return (req, res, next) => {
    // authenticateToken middleware should be used before this
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // If roles is a string, convert to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    logger.warn("Unauthorized role access attempt", { 
      path: req.path,
      userRole: req.user.role,
      requiredRoles: allowedRoles
    });
    
    return res.status(403).json({ message: "You don't have permission to access this resource" });
  };
};
