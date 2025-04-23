import express from "express";
import {
  createJobDescription,
  getJobDescriptionById,
  updateJobDescription,
  searchUpdateJobDescriptions,
  getAllJobs,
  searchJobsInProcess,
  updateJobDescriptionApproveStatus,
} from "../controllers/jobController.js";
import { analyzeBias } from "../controllers/biasController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  getJobMetrics,
  getJobTrends,
} from "../controllers/jobMetricsDashboardController.js";

const router = express.Router();
// router.use(authenticateToken);

router.get("/", getAllJobs);
router.post("/", createJobDescription);
router.get("/metrics", getJobMetrics);
router.get("/trends", getJobTrends);
router.get("/:id", getJobDescriptionById);
router.put("/:id", updateJobDescription);
router.post("/analyze-bias", analyzeBias);
router.post("/search", searchUpdateJobDescriptions);
router.post("/in-process", searchJobsInProcess);
router.put("/:id/approve", updateJobDescriptionApproveStatus);

export default router;
