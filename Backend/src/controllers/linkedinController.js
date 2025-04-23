import linkedinService from "../services/linkedinService.js";
import Job from "../models/jobModel.js";
import { logger } from "../config/logger.js";

/**
 * Initiate LinkedIn OAuth flow
 */
export const initiateAuth = (req, res) => {
  try {
    const authUrl = linkedinService.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    logger.error("LinkedIn auth initiation error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to initiate LinkedIn authentication",
    });
  }
};

/**
 * Handle LinkedIn OAuth callback
 */
export const handleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code missing",
      });
    }

    // Exchange code for access token
    const accessToken = await linkedinService.getAccessToken(code);

    // Store token in session or return to client
    req.session.linkedinAccessToken = accessToken;

    res.redirect("/dashboard?linkedin=connected");
  } catch (error) {
    logger.error("LinkedIn callback error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "LinkedIn authentication failed",
    });
  }
};

/**
 * Post a job to LinkedIn
 */
export const postJobToLinkedIn = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    logger.info("LinkedIn job posting requested", { userId, jobId });

    // Retrieve job from database
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Check if job is in publishable state
    if (job.status !== "Published") {
      return res.status(400).json({
        success: false,
        error: "Only published jobs can be posted to LinkedIn",
      });
    }

    // Post to LinkedIn
    const result = await linkedinService.postJob(job.toObject());

    if (result.success) {
      // Update job with LinkedIn reference
      job.externalPlatforms = job.externalPlatforms || {};
      job.externalPlatforms.linkedin = {
        id: result.linkedInJobId,
        postedAt: new Date(),
        status: "active",
      };

      await job.save();

      return res.json({
        success: true,
        message: "Job successfully posted to LinkedIn",
        linkedInJobId: result.linkedInJobId,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Failed to post job to LinkedIn",
        details: result.details,
      });
    }
  } catch (error) {
    logger.error("LinkedIn job posting error", {
      userId: req.user?.id,
      jobId: req.params.jobId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error while posting to LinkedIn",
    });
  }
};
