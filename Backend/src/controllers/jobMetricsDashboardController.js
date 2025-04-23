import Job from "../models/jobModel.js";
import { logger } from "../config/logger.js";
import mongoose from "mongoose";

// Get job metrics for the dashboard
export const getJobMetrics = async (req, res) => {
  try {
    logger.info("Fetching job metrics for dashboard");

    // Get counts by status
    const [total, pendingApproval, approved, formatted, published] =
      await Promise.all([
        Job.countDocuments({}),
        Job.countDocuments({ status: "Pending for Approval" }),
        Job.countDocuments({ status: "Approved" }),
        Job.countDocuments({ status: "Formatted" }),
        Job.countDocuments({ status: "Published" }),
      ]);

    // Get department distribution
    const departmentAggregation = await Job.aggregate([
      {
        $addFields: {
          normalizedDepartment: {
            $toLower: { $trim: { input: "$department" } },
          },
        },
      },
      {
        $group: {
          _id: "$normalizedDepartment",
          value: { $sum: 1 },
          // Collect all variations of the name
          allNames: { $push: "$department" },
        },
      },
      {
        $project: {
          // Pick the best representation (properly capitalized if available)
          name: {
            $reduce: {
              input: "$allNames",
              initialValue: { $arrayElemAt: ["$allNames", 0] },
              in: {
                $cond: [
                  // If current value starts with uppercase and accumulator doesn't
                  {
                    $and: [
                      { $regexMatch: { input: "$$this", regex: /^[A-Z]/ } },
                      {
                        $not: {
                          $regexMatch: { input: "$$value", regex: /^[A-Z]/ },
                        },
                      },
                    ],
                  },
                  "$$this", // Choose the capitalized version
                  "$$value", // Keep existing value
                ],
              },
            },
          },
          value: 1,
          _id: 0,
        },
      },
      { $sort: { value: -1 } },
      { $limit: 10 }, // Top 10 departments
    ]);

    // Get location distribution
    const locationAggregation = await Job.aggregate([
      {
        $addFields: {
          normalizedLocation: { $toLower: { $trim: { input: "$location" } } },
        },
      },
      {
        $group: {
          _id: "$normalizedLocation",
          value: { $sum: 1 },
          // Collect all variations of the name
          allNames: { $push: "$location" },
        },
      },
      {
        $project: {
          // Pick the best representation (properly capitalized if available)
          name: {
            $reduce: {
              input: "$allNames",
              initialValue: { $arrayElemAt: ["$allNames", 0] },
              in: {
                $cond: [
                  // If current value starts with uppercase and accumulator doesn't
                  {
                    $and: [
                      { $regexMatch: { input: "$$this", regex: /^[A-Z]/ } },
                      {
                        $not: {
                          $regexMatch: { input: "$$value", regex: /^[A-Z]/ },
                        },
                      },
                    ],
                  },
                  "$$this", // Choose the capitalized version
                  "$$value", // Keep existing value
                ],
              },
            },
          },
          value: 1,
          _id: 0,
        },
      },
      { $sort: { value: -1 } },
      { $limit: 10 }, // Top 10 locations
    ]);
    // Format and send response
    res.json({
      success: true,
      data: {
        totalJobs: total,
        pendingApproval,
        approved,
        formatted,
        published,
        byDepartment: departmentAggregation,
        byLocation: locationAggregation,
      },
    });
  } catch (error) {
    logger.error("Error fetching job metrics", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch job metrics",
      message: error.message,
    });
  }
};

// Get job trends over time
export const getJobTrends = async (req, res) => {
  try {
    const { timeRange = "6months" } = req.query;

    // Calculate the date range (default to 6 months)
    const endDate = new Date();
    const startDate = new Date();

    if (timeRange === "1month") {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (timeRange === "3months") {
      startDate.setMonth(endDate.getMonth() - 3);
    } else if (timeRange === "1year") {
      startDate.setFullYear(endDate.getFullYear() - 1);
    } else {
      // Default to 6 months
      startDate.setMonth(endDate.getMonth() - 6);
    }

    // Using MongoDB aggregation to get job creation trends by month
    const jobTrendsByMonth = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          count: 1,
        },
      },
    ]);

    // Using aggregation to get status changes over time
    const statusTrends = await Job.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$updatedAt" },
            year: { $year: "$updatedAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          status: "$_id.status",
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        jobCreationByMonth: jobTrendsByMonth,
        statusChangesByMonth: statusTrends,
      },
    });
  } catch (error) {
    logger.error("Error fetching job trends", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch job trends",
      message: error.message,
    });
  }
};
