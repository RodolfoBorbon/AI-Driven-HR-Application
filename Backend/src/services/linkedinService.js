import axios from "axios";
import { logger } from "../config/logger.js";

class LinkedInService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    this.organizationId = process.env.LINKEDIN_ORGANIZATION_ID;

    this.baseUrl = "https://api.linkedin.com/v2";
    this.accessToken = null;
  }

  getAuthorizationUrl() {
    const scopes =
      "r_liteprofile r_emailaddress w_organization_social rw_organization_admin";

    return (
      `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${Math.random().toString(36).substring(2, 15)}`
    );
  }

  async getAccessToken(authorizationCode) {
    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        null,
        {
          params: {
            grant_type: "authorization_code",
            code: authorizationCode,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      logger.error("LinkedIn access token error", {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error("Failed to obtain LinkedIn access token");
    }
  }

  async postJob(jobData) {
    if (!this.accessToken) {
      throw new Error("LinkedIn access token not available");
    }

    try {
      logger.info("Preparing job for LinkedIn posting", {
        jobId: jobData._id,
        jobTitle: jobData.jobTitle,
      });

      // Convert job to LinkedIn format
      const linkedinJobData = this.convertToLinkedInFormat(jobData);

      // Validate required fields
      this.validateLinkedInJobData(linkedinJobData);

      // Post to LinkedIn API
      const response = await axios.post(
        `${this.baseUrl}/jobs`,
        linkedinJobData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      logger.info("Job successfully posted to LinkedIn", {
        jobId: jobData._id,
        linkedInJobId: response.data.id,
      });

      return {
        success: true,
        linkedInJobId: response.data.id,
        data: response.data,
      };
    } catch (error) {
      logger.error("LinkedIn job posting failed", {
        jobId: jobData._id,
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }

  convertToLinkedInFormat(job) {
    return {
      author: `urn:li:organization:${this.organizationId}`,
      companyId: this.organizationId,
      title: job.jobTitle,
      description: {
        text: this.buildJobDescription(job),
      },
      locationPlacement: {
        location: `urn:li:place:${job.location}`,
        country: "US", // Default to US - would need to be dynamic
      },
      employmentStatus: this.mapJobType(job.jobType),
      workRemoteAllowed:
        job.workEnvironment?.toLowerCase().includes("remote") || false,
      listedAt: Date.now(),
      applyMethod: {
        applyUrl:
          job.applicationInstructions ||
          `https://yourcompany.com/careers/${job._id}`,
      },
    };
  }

  buildJobDescription(job) {
    const sections = [];

    if (job.aboutCompany) {
      sections.push(`# About Us\n${job.aboutCompany}`);
    }

    if (job.positionSummary) {
      sections.push(`# Position Summary\n${job.positionSummary}`);
    }

    if (job.keyResponsibilities && job.keyResponsibilities.length > 0) {
      const responsibilities = job.keyResponsibilities
        .map((r) => `- ${r}`)
        .join("\n");
      sections.push(`# Key Responsibilities\n${responsibilities}`);
    }

    if (job.requiredSkills && job.requiredSkills.length > 0) {
      const skills = job.requiredSkills.map((s) => `- ${s}`).join("\n");
      sections.push(`# Required Skills\n${skills}`);
    }

    if (job.preferredSkills && job.preferredSkills.length > 0) {
      const skills = job.preferredSkills.map((s) => `- ${s}`).join("\n");
      sections.push(`# Preferred Skills\n${skills}`);
    }

    return sections.join("\n\n");
  }

  mapJobType(jobType) {
    if (!jobType) return "FULL_TIME";

    const type = jobType.toLowerCase();
    if (type.includes("part")) return "PART_TIME";
    if (type.includes("contract")) return "CONTRACT";
    if (type.includes("intern")) return "INTERN";
    if (type.includes("volunteer")) return "VOLUNTEER";
    return "FULL_TIME"; // Default
  }

  validateLinkedInJobData(jobData) {
    const requiredFields = ["author", "companyId", "title", "description"];

    const missingFields = requiredFields.filter((field) => !jobData[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required LinkedIn job fields: ${missingFields.join(", ")}`
      );
    }

    return true;
  }
}

export default new LinkedInService();
