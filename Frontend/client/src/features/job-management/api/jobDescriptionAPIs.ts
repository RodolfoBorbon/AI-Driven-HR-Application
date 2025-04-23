import axios from 'axios';
import { JobFormData } from '../types/createJobDescriptionSchemas'; 
import { JobDescription } from '@/features/job-management/types/createJobDescriptionInterfaces';
import { BiasAnalysisRequest, BiasAnalysisResponse } from '@/features/job-management/types/createJobDescriptionInterfaces';
import { UpdateSearchResponse, UpdateJobFilters } from '@/features/job-management/types/createJobDescriptionInterfaces';
import { 
  UpdateJobListStatusFilters,
  UpdateSearchJobListStatusResponse,
  PublishJobRequest,
  PublishJobResponse,
  JobAutoCompleteRequest,
  JobAutoCompleteResponse,
} from '@/features/job-management/types/createJobDescriptionInterfaces';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with interceptor for auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/////////////////////// Create Job Description - retrieve object using the ID API///////////////////////
export const createJobDescription = async (data: JobFormData) => {
  try {
    console.log("📤 Sending to API:", JSON.stringify(data, null, 2));
    const response = await axios.post(`${API_URL}/job-descriptions`, data);
    
    console.log("✅ Response from API:", response.data);

    // Ensure we have an id in the response
    if (!response.data.id) {
      throw new Error("API response is missing job ID");
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error creating job description:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("API endpoint not found. Please check server configuration.");
      }
      throw new Error(error.response?.data?.message || "Failed to create job description");
    }
    throw error;
  }
};

// Get Job Description by ID API in order to populate the Job Description data in the form
export const getJobDescriptionById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/job-descriptions/${id}`);
    
    // Process the additionalFields if they exist
    if (response.data && response.data.additionalFields) {
      // Check if additionalFields is coming as a nested object with key/value pairs
      // This handles MongoDB Map structures returned as objects
      if (typeof response.data.additionalFields === 'object' && 
          !Array.isArray(response.data.additionalFields)) {
        
        console.log("Processing additionalFields from API:", response.data.additionalFields);
        
        // Convert Map-like structure to plain object if needed
        if (response.data.additionalFields instanceof Map) {
          const plainObj: Record<string, string> = {};
          response.data.additionalFields.forEach((value: string, key: string) => {
            plainObj[key] = value;
          });
          response.data.additionalFields = plainObj;
        }
      }
    } else if (response.data) {
      // If additionalFields doesn't exist, initialize as empty object
      response.data.additionalFields = {};
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching job description:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Job description not found");
      }
      throw new Error(error.response?.data?.message || "Failed to fetch job description");
    }
    throw error;
  }
};

export const updateJobDescription = async (id: string, data: JobFormData) => {
  try {
    // Ensure we're sending the correct structure for additionalFields
    console.log("📤 Sending update to API with additionalFields:", data.additionalFields);
    
    // Deep clone the data to avoid reference issues
    const dataToSend = {
      ...data,
      // Make sure additionalFields is an object, not undefined
      additionalFields: data.additionalFields || {}
    };
    
    // Extra validation to ensure additionalFields is properly formed
    if (typeof dataToSend.additionalFields !== 'object') {
      console.warn("additionalFields is not an object, fixing:", dataToSend.additionalFields);
      dataToSend.additionalFields = {};
    }
    
    console.log("📤 Final data being sent to API:", JSON.stringify(dataToSend, null, 2));
    
    const response = await axios.put(`${API_URL}/job-descriptions/${id}`, dataToSend);
    
    console.log("✅ Response from API:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ Error updating job description:", error);
    throw error;
  }
};

//////////////////////// Analyze Job Description for Bias API//////////////////////
export const analyzeBias = async (data: BiasAnalysisRequest): Promise<BiasAnalysisResponse> => {
  try {
    console.log("📤 Sending job description for bias analysis:", JSON.stringify(data, null, 2));
    
    const response = await axios.post<BiasAnalysisResponse>(
      `${API_URL}/analyze-bias`,
      data
    );
    
    // Log the raw response for debugging
    console.log("📥 Raw bias analysis response:", response.data);

    if (!response.data.success) {
      console.error("❌ Bias analysis failed:", response.data.error);
      return {
        success: false,
        error: response.data.error || "Bias analysis failed"
      };
    }

    // Validate and sanitize the recommendations
    if (!response.data.recommendations || typeof response.data.recommendations !== 'object') {
      console.error("❌ Invalid recommendations format");
      return {
        success: false,
        error: "Invalid recommendations format"
      };
    }

    // Log the processed response
    console.log("✅ Processed bias analysis:", response.data);

    return {
      success: true,
      recommendations: response.data.recommendations
    };

  } catch (error) {
    console.error("❌ Error analyzing bias:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error("Server error details:", error.response.data);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
};

////////////////// Search-Update functionality under the Update Job Description button with posted status/////////////
export const searchUpdateJobs = async (filters: UpdateJobFilters): Promise<UpdateSearchResponse> => {
  try {
    console.log("📤 Sending update search request:", filters);
    
    const response = await axios.post<UpdateSearchResponse>(
      `${API_URL}/search-job-update`,
      {
        ...filters,
        status: "Published"
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || "Update search failed");
    }

    console.log("✅ Update search results:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Error searching jobs for update:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        data: [],
        error: error.response.data.message || "Failed to search jobs for update"
      };
    }
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
};

////////////////// Search Jobs In Process Listings API ////////////////////
export const searchJobsListInProcess = async (
  filters: UpdateJobListStatusFilters
): Promise<UpdateSearchJobListStatusResponse> => {
  try {
    console.log("📤 Sending jobs list search request:", filters);
    
    const response = await axios.post<UpdateSearchJobListStatusResponse>(
      `${API_URL}/search-jobs-in-process`,
      filters
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || "Jobs list search failed");
    }

    console.log("✅ Jobs list search results:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Error searching jobs list:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        data: [],
        error: error.response.data.message || "Failed to search jobs list"
      };
    }
    return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
};

//Update-Approve Job Description
export const updateJobDescriptionApproveStatus = async (
  id: string, 
  data: Partial<JobDescription>
) => {
  try {
    console.log("📤 Sending status update:", JSON.stringify(data, null, 2));
    
    const response = await axios.patch(
      `${API_URL}/job-descriptions/${id}/status-approved`,
      data
    );
    
    console.log("✅ Response from API:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating job status:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Failed to update job status");
    }
    throw error;
  }
};

// Handle job publishing for indeed and linkedin
export const publishJob = async (data: PublishJobRequest): Promise<PublishJobResponse> => {
  try {
    console.log(`📤 Publishing job ${data.jobId} to ${data.platform}...`);
    
    const response = await axios.post<PublishJobResponse>(
      `${API_URL}/publish-job`,
      data
    );
    
    if (!response.data.success) {
      console.error(`❌ Job publishing failed for ${data.platform}:`, response.data.error);
      throw new Error(response.data.error || `Failed to publish job to ${data.platform}`);
    }

    console.log(`✅ Job published successfully to ${data.platform}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error publishing job to ${data.platform}:`, error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error("Server error details:", error.response.data);
      throw new Error(error.response.data.message || `Failed to publish job to ${data.platform}`);
    }
    throw error instanceof Error ? error : new Error("An unknown error occurred");
  }
};

// Get job auto-complete suggestions
export const getJobAutoComplete = async (
  jobTitle: string
): Promise<JobAutoCompleteResponse> => {
  try {
    console.log("📤 Requesting auto-complete suggestions for job title:", jobTitle);
    
    const response = await axios.post<JobAutoCompleteResponse>(
      `${API_URL}/job-autocomplete`,
      { jobTitle }
    );
    
    if (!response.data.success) {
      console.error("❌ Auto-complete request failed:", response.data.error);
      throw new Error(response.data.error || "Failed to get job suggestions");
    }

    console.log("✅ Received auto-complete suggestions:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching job auto-complete:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data.message || "Failed to get job suggestions"
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
};


// Fetching Job Metrics
export const fetchJobMetrics = async () => {
  try {
    console.log("📤 Requesting job metrics data");
    
    const response = await axios.get(
      `${API_URL}/job-descriptions/metrics`
    );
    
    if (!response.data.success) {
      console.error("❌ Job metrics request failed:", response.data.error);
      throw new Error(response.data.error || "Failed to fetch job metrics");
    }

    console.log("✅ Received job metrics data:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching job metrics:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch job metrics');
    }
    throw error instanceof Error ? error : new Error("An unknown error occurred");
  }
};

// Fetching Job Trends
export const fetchJobTrends = async (timeRange = '6months') => {
  try {
    console.log("📤 Requesting job trends data");
    
    const response = await axios.get(
      `${API_URL}/job-descriptions/trends?timeRange=${timeRange}`
    );
    
    if (!response.data.success) {
      console.error("❌ Job trends request failed:", response.data.error);
      throw new Error(response.data.error || "Failed to fetch job trends");
    }

    console.log("✅ Received job trends data:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching job trends:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.error || 'Failed to fetch job trends');
    }
    throw error instanceof Error ? error : new Error("An unknown error occurred");
  }
};
