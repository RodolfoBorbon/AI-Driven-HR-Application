import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    jobType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending for Approval", "Approved", "Formatted", "Published"],
      default: "Pending for Approval",
    },
    aboutCompany: {
      type: String,
      required: true,
      trim: true,
    },
    positionSummary: {
      type: String,
      required: true,
      trim: true,
    },
    keyResponsibilities: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    compensation: {
      type: String,
      trim: true,
    },
    workEnvironment: {
      type: String,
      trim: true,
    },
    diversityStatement: {
      type: String,
      trim: true,
    },
    applicationInstructions: {
      type: String,
      trim: true,
    },
    contactInformation: {
      type: String,
      trim: true,
    },
    additionalInformation: {
      type: String,
      trim: true,
    },
    // Make sure additionalFields is properly typed as a Map
    additionalFields: {
      type: Map,
      of: String,
      default: () => new Map()
    },
    approvalComments: {
      type: String,
      trim: true,
    },
    formattedContent: {
      type: String,
      trim: true,
    }
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
