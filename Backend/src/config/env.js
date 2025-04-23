import dotenv from "dotenv";
import fs from "fs";
import path from "path";

export const loadEnv = () => {
  // Load environment variables

  dotenv.config();

  // Validate critical environment variables
  const requiredEnvVars = ["GEMINI_API_KEY", "JWT_SECRET", "MONGODB_URI"];

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
};
