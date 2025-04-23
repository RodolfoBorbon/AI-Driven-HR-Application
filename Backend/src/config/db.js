import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./logger.js";
import User from "../models/userModel.js";

dotenv.config();

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin user if it doesn't exist
    await User.createDefaultAdmin();
    
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
