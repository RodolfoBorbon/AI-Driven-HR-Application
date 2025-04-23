import sanitizeHtml from "sanitize-html";
import { logger } from "../config/logger.js";

export const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    const originalBody = { ...req.body };

    const sanitizeValue = (value) => {
      if (typeof value === "string") {
        return sanitizeHtml(value, {
          allowedTags: [], // No HTML tags allowed
          allowedAttributes: {},
        });
      } else if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
      } else if (value && typeof value === "object") {
        return sanitizeObject(value);
      }
      return value;
    };

    const sanitizeObject = (obj) => {
      const result = {};
      Object.keys(obj).forEach((key) => {
        result[key] = sanitizeValue(obj[key]);
      });
      return result;
    };

    req.body = sanitizeValue(req.body);

    // Log if any content was sanitized (but don't log full content)
    const keysChanged = Object.keys(req.body).filter(
      (key) =>
        typeof originalBody[key] === "string" &&
        originalBody[key] !== req.body[key]
    );

    if (keysChanged.length > 0) {
      logger.info("Content sanitized", {
        path: req.path,
        sanitizedFields: keysChanged,
      });
    }
  }
  next();
};
