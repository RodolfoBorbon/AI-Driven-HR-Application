import winston from "winston";
import path from "path";
import fs from "fs";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define sensitive fields that should never be logged
const sensitiveFields = [
  "password",
  "token",
  "apiKey",
  "api_key",
  "GEMINI_API_KEY",
  "JWT_SECRET",
  "secret",
  "authorization",
  "cookie",
];

// Format to redact sensitive data
const redactSensitive = winston.format((info) => {
  // Create a deep copy to avoid modifying the original info object
  const sanitized = JSON.parse(JSON.stringify(info));

  // Recursive function to redact sensitive fields
  const redactFields = (obj) => {
    if (!obj || typeof obj !== "object") return;

    Object.keys(obj).forEach((key) => {
      // Check if key name contains any sensitive field names (case insensitive)
      const lowerKey = key.toLowerCase();
      if (
        sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
      ) {
        obj[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        // Recursively process nested objects
        redactFields(obj[key]);
      }
    });
  };

  redactFields(sanitized);
  return sanitized;
});

// Create logger with enhanced configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    redactSensitive(),
    winston.format.json()
  ),
  defaultMeta: { service: "job-description-api" },
  transports: [
    // Error logs - separate file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Console output with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
  // Prevent winston from exiting on uncaught exceptions
  exitOnError: false,
});

// Add custom logging method for security events
logger.security = (message, meta) => {
  logger.warn(message, { ...meta, logType: "SECURITY" });
};
