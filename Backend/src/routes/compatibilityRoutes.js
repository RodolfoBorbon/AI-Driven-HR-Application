import express from "express";
import {
  searchJobsInProcess,
  updateJobDescriptionApproveStatus,
  searchUpdateJobDescriptions,
  updateJobDescription,
} from "../controllers/jobController.js";
import { autoCompleteJobDescription } from "../controllers/aiController.js";
import { analyzeBias } from "../controllers/biasController.js";
// This router handles legacy client-side URLs
const router = express.Router();

// Map URLs the client is using to their controller functions
router.post("/api/search-jobs-in-process", searchJobsInProcess);
router.post("/api/auto-complete-job", autoCompleteJobDescription);
router.post("/api/search-job-update", searchUpdateJobDescriptions);
router.put("/api/job-approve/:id", updateJobDescriptionApproveStatus);
router.patch(
  "/api/job-descriptions/:id/status-approved",
  updateJobDescriptionApproveStatus
);
router.post("/api/analyze-bias", analyzeBias);
router.post("/api/job-autocomplete", autoCompleteJobDescription);
router.put("/api/job-descriptions/:id", updateJobDescription);

export default router;
