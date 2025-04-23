import Job from "../models/jobModel.js";
import { logger } from "../config/logger.js";
import mongoose from "mongoose";
// Create Job Description CONTROLLER
export const createJobDescription = async (req, res) => {
  try {
    console.log(
      "📥 Received Job Description Data:",
      JSON.stringify(req.body, null, 2)
    );

    if (!req.body.jobTitle || !req.body.department || !req.body.location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const job = new Job(req.body);
    const savedJob = await job.save();

    console.log("✅ Job Successfully Saved:", savedJob);

    const formattedResponse = {
      id: savedJob._id.toString(),
      ...savedJob.toObject(),
      _id: undefined,
    };

    res.status(201).json(formattedResponse);
  } catch (error) {
    console.error("❌ Error saving job:", error.message);
    res.status(400).json({ message: error.message });
  }
};
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().lean().exec();

    const formattedJobs = jobs.map((job) => ({
      id: job._id.toString(),
      ...job,
      _id: undefined,
    }));

    res.json({
      success: true,
      count: formattedJobs.length,
      data: formattedJobs,
    });
  } catch (error) {
    console.error("❌ Error fetching jobs:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve job descriptions",
      message: error.message,
    });
  }
};

// Get Job Description by ID CONTROLLER
export const getJobDescriptionById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const formattedResponse = {
      id: job._id.toString(),
      ...job.toObject(),
      _id: undefined,
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error("❌ Error fetching job:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Update Job Description CONTROLLER
export const updateJobDescription = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updatedData = { ...req.body };

    // Log update attempt and the data being used for update
    console.log("🔍 Update attempt for job ID:", jobId);
    console.log("📝 Update data received:", JSON.stringify(updatedData, null, 2));

    // Special handling for additionalFields
    if (updatedData.additionalFields) {
      console.log("Found additionalFields in update:", updatedData.additionalFields);
      
      // If it's an empty object but we need to maintain the fields, retrieve from DB first
      if (Object.keys(updatedData.additionalFields).length === 0) {
        console.log("Empty additionalFields detected, checking if we need to preserve existing fields");
        
        // Get the current document to check if it has additionalFields
        const existingJob = await Job.findById(jobId);
        if (existingJob && existingJob.additionalFields && existingJob.additionalFields.size > 0) {
          console.log("Found existing additionalFields, preserving them:", 
            Object.fromEntries(existingJob.additionalFields.entries()));
          
          // If the existing job has additionalFields and the update has none, preserve the existing ones
          // Do nothing to additionalFields to keep the existing Map
          delete updatedData.additionalFields; 
        } else {
          // Otherwise set to empty Map as before
          updatedData.additionalFields = new Map();
        }
      } 
      // If additionalFields has content, let MongoDB handle conversion to Map
    }

    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      console.error("❌ Invalid MongoDB ID format:", jobId);
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, updatedData, {
      new: true,
    });

    if (!updatedJob) {
      console.error("❌ Job not found with ID:", jobId);
      return res.status(404).json({ message: "Job not found" });
    }

    console.log("✅ Job Successfully Updated:", updatedJob);
    console.log("📌 Updated additionalFields:", 
      updatedJob.additionalFields ? Object.fromEntries(updatedJob.additionalFields.entries()) : {});

    // Format response consistently with other endpoints
    const formattedResponse = {
      id: updatedJob._id.toString(),
      ...updatedJob.toObject(),
      _id: undefined,
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error("❌ Error updating job:", error.message, error.stack);
    res.status(400).json({ message: error.message });
  }
};

// Search-Update Job Description CONTROLLER
export const searchUpdateJobDescriptions = async (req, res) => {
  try {
    console.log(
      "📤 Received search filters:",
      JSON.stringify(req.body, null, 2)
    );

    // Include status in destructured variables
    const { jobTitle, department, location, jobType, status } = req.body;

    let searchQuery = {};

    if (jobTitle) {
      searchQuery.jobTitle = { $regex: jobTitle, $options: "i" };
    }
    if (department) {
      searchQuery.department = { $regex: department, $options: "i" };
    }
    if (location) {
      searchQuery.location = { $regex: location, $options: "i" };
    }
    if (jobType) {
      searchQuery.jobType = { $regex: jobType, $options: "i" };
    }

    // Add status filter
    if (status) {
      searchQuery.status = status; // Exact match for status
    }

    console.log(
      "🔍 Executing search with query:",
      JSON.stringify(searchQuery, null, 2)
    );

    const jobs = await Job.find(searchQuery)
      .select("jobTitle department location jobType status") // Include status in selection
      .lean()
      .exec();

    console.log(`✅ Found ${jobs.length} matching jobs`);

    const formattedJobs = jobs.map((job) => ({
      id: job._id.toString(),
      jobTitle: job.jobTitle,
      department: job.department,
      location: job.location,
      jobType: job.jobType,
      status: job.status, // Include status in response
    }));

    res.json({
      success: true,
      data: formattedJobs,
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search job descriptions",
      message: error.message,
    });
  }
};
export const searchJobsInProcess = async (req, res) => {
  try {
    console.log(
      "📤 Received search filters:",
      JSON.stringify(req.body, null, 2)
    );
    const {
      jobTitle,
      department,
      location,
      status,
      page = 1,
      limit = 10,
    } = req.body;

    // Build the search query
    let searchQuery = {
      status: {
        $in: ["Pending for Approval", "Approved", "Formatted"],
      },
    };

    // Add non-empty filters using regex for partial matches
    if (jobTitle) {
      searchQuery.jobTitle = { $regex: jobTitle, $options: "i" };
    }
    if (department) {
      searchQuery.department = { $regex: department, $options: "i" };
    }
    if (location) {
      searchQuery.location = { $regex: location, $options: "i" };
    }
    if (status) {
      searchQuery.status = { $regex: status, $options: "i" };
    }

    logger.info("Executing job search with query", { query: searchQuery });

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute the search with pagination
    const [jobs, total] = await Promise.all([
      Job.find(searchQuery)
        .select("jobTitle department location status")
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Job.countDocuments(searchQuery),
    ]);

    // Format the response
    const formattedJobs = jobs.map((job) => ({
      id: job._id.toString(),
      jobTitle: job.jobTitle,
      department: job.department,
      location: job.location,
      status: job.status,
    }));

    res.json({
      success: true,
      data: formattedJobs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    logger.error("Search error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to search job descriptions",
      message: error.message,
    });
  }
};

// Update-Approve Job Description CONTROLLER
export const updateJobDescriptionApproveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(updatedJob);
  } catch (error) {
    logger.error("Error updating job status", { error: error.message });
    res.status(500).json({ message: error.message });
  }
};
