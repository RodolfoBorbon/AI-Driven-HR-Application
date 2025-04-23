import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { searchUpdateJobs, getJobDescriptionById } from "@/features/job-management/api/jobDescriptionAPIs";
import {
  UpdateJobFilters,
  UpdateJobResult,
  JobDescription
} from "@/features/job-management/types/createJobDescriptionInterfaces";

export function useSearchUpdateJobDescription(onClose: () => void) {
  // States
  const [updateSearchFilters, setUpdateSearchFilters] = useState<UpdateJobFilters>({
    jobTitle: "",
    department: "",
    location: "",
    jobType: "",
  });
  
  const [updateSearchResults, setUpdateSearchResults] = useState<UpdateJobResult[]>([]);
  const [selectedUpdateJob, setSelectedUpdateJob] = useState<UpdateJobResult | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedJobData, setSelectedJobData] = useState<JobDescription | null>(null);
  
  const { toast } = useToast();

  // Methods
  const handleUpdateSearch = async () => {
    try {
      toast({
        title: "Searching...",
        description: "Looking for published jobs to update",
      });

      const nonEmptyFilters = Object.fromEntries(
        Object.entries(updateSearchFilters).filter(([_, value]) => value.trim() !== '')
      );

      if (Object.keys(nonEmptyFilters).length === 0) {
        toast({
          title: "Warning",
          description: "Please enter at least one search criteria",
          variant: "destructive",
        });
        return;
      }

      // Explicitly add the Published status to the filters
      const filtersWithStatus = {
        ...updateSearchFilters,
        status: "Published"
      };

      const response = await searchUpdateJobs(filtersWithStatus);

      if (response.success) {
        const publishedJobs = response.data.filter(job => job.status === "Published");
        
        setUpdateSearchResults(publishedJobs);
        setSelectedUpdateJob(null);
        
        toast({
          title: publishedJobs.length === 0 ? "No Results" : "Success",
          description: publishedJobs.length === 0 
            ? "No published jobs found matching your criteria"
            : `Found ${publishedJobs.length} published jobs to update`,
        });
      } else {
        throw new Error(response.error || "Update search failed");
      }
    } catch (error) {
      console.error("Update search error:", error);
      toast({
        title: "Error",
        description: "Failed to search published jobs for update. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetUpdateSearch = () => {
    setUpdateSearchFilters({
      jobTitle: "",
      department: "",
      location: "",
      jobType: "",
    });
    setUpdateSearchResults([]);
    setSelectedUpdateJob(null);
  };

  const handleUpdateJobSelect = (job: UpdateJobResult) => {
    if (selectedUpdateJob?.id === job.id) {
      setSelectedUpdateJob(null);
      toast({
        title: "Unselected",
        description: `Unselected job: ${job.jobTitle}`,
      });
    } else {
      setSelectedUpdateJob(job);
      toast({
        title: "Selected",
        description: `Selected job for update: ${job.jobTitle}`,
      });
    }
  };
  
  const isJobSelected = (jobId: string): boolean => {
    return selectedUpdateJob?.id === jobId;
  };
  
  const handleUpdateSelectedJob = (): void => {
    if (selectedUpdateJob) {
      handleUpdateJob(selectedUpdateJob.id);
    }
  };

  const handleUpdateJob = async (jobId: string) => {
    try {
      const jobData = await getJobDescriptionById(jobId);
      if (jobData) {
        const formattedJobData: JobDescription = {
          id: jobId,
          jobTitle: jobData.jobTitle || '',
          department: jobData.department || '',
          location: jobData.location || '',
          jobType: jobData.jobType || '',
          status: jobData.status || 'Draft',
          aboutCompany: jobData.aboutCompany || '',
          positionSummary: jobData.positionSummary || '',
          keyResponsibilities: jobData.keyResponsibilities || '',
          requiredSkills: jobData.requiredSkills || '',
          preferredSkills: jobData.preferredSkills || '',
          compensation: jobData.compensation || '',
          workEnvironment: jobData.workEnvironment || '',
          diversityStatement: jobData.diversityStatement || '',
          applicationInstructions: jobData.applicationInstructions || '',
          contactInformation: jobData.contactInformation || '',
          additionalInformation: jobData.additionalInformation || '',
          additionalFields: jobData.additionalFields || {},
        };
  
        console.log('Formatted job data:', formattedJobData);
        setSelectedJobData(formattedJobData);
        setShowEditForm(true);
      } else {
        throw new Error("Failed to fetch job data");
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
      toast({
        title: "Error",
        description: "Failed to load job data for editing",
        variant: "destructive",
      });
    }
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setSelectedJobData(null);
  };

  const handleUpdateSuccess = () => {
    setShowEditForm(false);
    setSelectedJobData(null);
    toast({
      title: "Success",
      description: "Job description updated successfully",
    });
    resetUpdateSearch();
    onClose();
  };

  return {
    // States
    updateSearchFilters,
    setUpdateSearchFilters,
    updateSearchResults,
    selectedUpdateJob,
    showEditForm,
    selectedJobData,
    
    // Methods
    handleUpdateSearch,
    resetUpdateSearch,
    handleUpdateJobSelect,
    isJobSelected,
    handleUpdateSelectedJob,
    closeEditForm,
    handleUpdateSuccess
  };
}