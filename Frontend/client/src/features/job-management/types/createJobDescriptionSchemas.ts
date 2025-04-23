import * as z from "zod";

// Schema Definitions
export const jobFormSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  jobType: z.string().min(1, "Job type is required"),
  status: z.string().default("Pending for Approval"),
  aboutCompany: z.string().min(1, "Company description is required"),
  positionSummary: z.string().min(1, "Position summary is required"),
  keyResponsibilities: z.string().min(1, "Key responsibilities are required").optional(),
  requiredSkills: z.string().min(1, "Required skills are required").optional(),
  preferredSkills: z.string().min(1, "Preferred skills are required").optional(),
  compensation: z.string().min(1, "Compensation is required").optional(),
  workEnvironment: z.string().min(1, "Work environment is required").optional(),
  diversityStatement: z.string().min(1, "Diversity statement is required").optional(),
  applicationInstructions: z.string().min(1, "Application instructions are required").optional(),
  contactInformation: z.string().min(1, "Contact information is required").optional(),
  additionalInformation: z.string().min(1, "Additional information is required").optional(),
  additionalFields: z.record(z.string()).optional(),
});

export type JobFormData = z.infer<typeof jobFormSchema>;

// You can add more form schemas here as needed
