import { JobFormData } from "./createJobDescriptionSchemas";

export interface JobDescription {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  jobType: string;
  status: string; // Changed from string | undefined to just string
  aboutCompany: string;
  positionSummary: string;
  keyResponsibilities: string; // Changed from string | string[] to just string
  requiredSkills: string; // Changed from string | string[] to just string
  preferredSkills: string; // Changed from string | string[] to just string
  compensation?: string;
  workEnvironment?: string;
  diversityStatement?: string;
  applicationInstructions?: string;
  contactInformation?: string;
  additionalInformation?: string;
  additionalFields?: Record<string, string> | Map<string, string> | any;
  // ^ Added support for Map and any other format that might come from MongoDB
  
  // Add missing properties
  approvalComments?: string;
  formattedContent?: string;
}

export interface CreateJobDescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  initialData?: JobDescription;
  jobId?: string;
  onUpdateSuccess?: () => void;
}

export interface UseCreateJobDescriptionProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  initialData?: JobFormData;
  jobId?: string;
  onUpdateSuccess?: () => void;
}


// Bias Analysis Related Interfaces
export interface BiasAnalysisRequest {
    id: string;
    contextFields: {
        jobTitle: string;
        department: string;
        location: string;
        jobType: string;
        positionSummary: string;
    };
    fieldsToAnalyze: {
        keyResponsibilities?: string;
        requiredSkills?: string;
        preferredSkills?: string;
        compensation?: string;
        workEnvironment?: string;
        diversityStatement?: string;
        applicationInstructions?: string;
        contactInformation?: string;
        additionalInformation?: string;
        [key: string]: string | undefined;
    };
}

export interface BiasAnalysisResult {
    hasBias: boolean;
    biasType: string;
    suggestions: string[];
    explanation: string;
}

export interface BiasAnalysisResponse {
    success: boolean;
    recommendations?: Record<string, BiasAnalysisResult>;
    error?: string;  
  }

  ////////////////////////////////Update job description - SEARCH Interfaces///////////////////
  export interface UpdateSearchResponse {
    success: boolean;
    data: UpdateJobResult[];
    error?: string;
  }
  
  export interface UpdateJobFilters {
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
    status?: string;
  }
  
  export interface UpdateJobResult {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
    status?: string;
  }

  export interface UpdateJobFilters {
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
  }
  
  export interface UpdateJobResult {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
  }

  // Add this new interface for format updates
  export interface JobFormatUpdate {
    status: string;
    formattedContent: string;
    approvalComments?: string;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////
  export type ActiveFields = Record<string, boolean>;
  export type CustomField = {
    id: string;
    label: string;
    value: string;
    isActive: boolean;
  };
  
  export type BiasAnalysisOption = {
    original: string;
    alternative: string;
    selected: "original" | "alternative" | null;
  };
  
  export type JobSearchFilters = {
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
  };
  
  export type JobSearchResult = {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
  };
  
  export type JobDescriptionListItem = {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    status: "Pending for Approval" | "Approved" | "Formatted" | "Published"; 
  };
  
  export type SortField = "jobTitle" | "status";
  export type SortDirection = "asc" | "desc";
  
  // Add new type for job details
  export type JobDetails = {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    jobType: string;
    status: string;
    aboutCompany: string;
    positionSummary: string;
    keyResponsibilities?: string;
    requiredSkills?: string;
    preferredSkills?: string;
    compensation?: string;
    workEnvironment?: string;
    diversityStatement?: string;
    applicationInstructions?: string;
    contactInformation?: string;
    additionalInformation?: string;
    additionalFields?: { [key: string]: string };
  };

  export interface UpdateJobListStatusFilters {
    jobTitle?: string;
    department?: string;
    location?: string;
    status?: string;
    page?: number;   
    limit?: number;  
  }
  
  export interface UpdateJobListStatusResult {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    status: string;  
  }
  

  // interfaces for pagination
    export interface PaginationInfo {
      total: number;
      page: number;
      totalPages: number;
      hasMore: boolean;
    }

    export interface UpdateSearchJobListStatusResponse {
      success: boolean;
      data?: UpdateJobListStatusResult[];
      pagination?: PaginationInfo;
      error?: string;
    }

    // interfaces for job description publishing
    export interface PublishJobRequest {
      jobId: string;
      platform: string;
      formattedContent: string;
    }
    
    export interface PublishJobResponse {
      success: boolean;
      message?: string;
      error?: string;
      publishedJobUrl?: string;
    }

    // interfaces for job description auto-completion
    export interface JobAutoCompleteRequest {
      jobTitle: string;
    }
    
    export interface JobAutoCompleteResponse {
      success: boolean;
      data?: {
        positionSummary: string;
        keyResponsibilities: string;
        requiredSkills: string; 
        preferredSkills: string;
      };
      error?: string;
    }


      // interfaces for metrics from hiring module
      export interface JobMetricsResponse {
        success: boolean;
        data?: {
          totalJobs: number;
          pendingApproval: number;
          approved: number;
          formatted: number;
          published: number;
          byDepartment: { name: string; value: number }[];
          byLocation: { name: string; value: number }[];
        };
        error?: string;
      }
      
      export interface JobTrendsResponse {
        success: boolean;
        data?: {
          jobCreationByMonth: { month: string; count: number }[];
          statusChangesByMonth: { month: string; status: string; count: number }[];
        };
        error?: string;
      }