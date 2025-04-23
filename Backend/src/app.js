import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cors from "./middleware/corsMiddleware.js";
import { sanitizeInputs } from "./middleware/sanitizeMiddleware.js";
import jobRoutes from "./routes/jobRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import linkedinRoutes from "./routes/linkedinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import compatibilityRoutes from "./routes/compatibilityRoutes.js";
import { connectDB } from "./config/db.js";
import { loadEnv } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = express();

// Load environment variables
loadEnv();

// Connect to MongoDB
connectDB();

// Session middleware for storing OAuth tokens (can keep this for other purposes)
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Other middleware
app.use(bodyParser.json());
app.use(cors);
app.use(sanitizeInputs);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/job-descriptions", jobRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/", compatibilityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
