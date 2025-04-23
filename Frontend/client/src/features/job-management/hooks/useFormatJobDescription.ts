import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { JobDescription, JobFormatUpdate } from "@/features/job-management/types/createJobDescriptionInterfaces";
import { getJobDescriptionById, updateJobDescriptionApproveStatus } from "@/features/job-management/api/jobDescriptionAPIs";
import { PublishJobParams, PublishJobResult, Platform, UseFormatJobDescriptionProps } from "@/features/job-management/types/formatJobDescriptionInterfaces";

// Moved the publishJob function to the hook file
const publishJob = async (params: PublishJobParams): Promise<PublishJobResult> => {
  try {
    // This is a placeholder. Replace with actual API call in your implementation
    console.log(`Publishing job ${params.jobId} to ${params.platform}`);
    
    // Simulate API call success
    // In a real implementation, you'd make an actual API request here
    return { success: true };
  } catch (error) {
    console.error(`Error publishing to ${params.platform}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const useFormatJobDescription = ({
  jobId,
  isOpen,
  onClose,
  onFormatSuccess,
}: UseFormatJobDescriptionProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("preview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [jobData, setJobData] = useState<JobDescription | null>(null);
  const [formattedContent, setFormattedContent] = useState("");
  const [error, setError] = useState("");

  const [formattedPreview, setFormattedPreview] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false);
  const [publishingJob, setPublishingJob] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Selected platforms for publishing
  const [selectedPlatforms, setSelectedPlatforms] = useState<{
    indeed: boolean;
    linkedin: boolean;
  }>({
    indeed: false,
    linkedin: false
  });

  // Direct role-based permission check
  const canFormatJobs = user?.role === "HR Assistant" || user?.role === "IT Admin";
  
  useEffect(() => {
    if (isOpen) {
      console.log("Format permissions check:", { 
        userRole: user?.role, 
        canFormat: canFormatJobs 
      });
      
      // If we have permission issues, log them but still try to load data
      if (!canFormatJobs) {
        console.warn("User does not have format permissions");
      }
      
      // Always try to load data regardless of permissions
      loadJobData();
    }
  }, [isOpen, user?.role]);

  const loadJobData = async () => {
    try {
      setIsLoading(true);
      const data = await getJobDescriptionById(jobId);
      
      if (!data) {
        throw new Error("No data returned from API");
      }
      
      // Normalize additionalFields from various formats into a standard object
      if (data.additionalFields) {
        const normalizeAdditionalFields = (fields: any): Record<string, string> => {
          if (!fields) return {};
          
          // Handle MongoDB Map object
          if (fields instanceof Map) {
            const obj: Record<string, string> = {};
            fields.forEach((value, key) => {
              obj[key] = value;
            });
            return obj;
          }
          
          // Handle plain object
          if (typeof fields === 'object' && !Array.isArray(fields)) {
            return fields;
          }
          
          // Handle other cases (string, array, etc.)
          try {
            if (typeof fields === 'string') {
              return JSON.parse(fields);
            }
            
            if (Array.isArray(fields)) {
              const obj: Record<string, string> = {};
              for (const item of fields) {
                if (item && typeof item === 'object' && ('key' in item || 'k' in item)) {
                  const key = 'key' in item ? item.key : item.k;
                  const value = 'value' in item ? item.value : item.v;
                  obj[key] = value;
                }
              }
              return obj;
            }
          } catch (e) {
            console.error("Error normalizing additionalFields:", e);
          }
          
          return {};
        };
        
        data.additionalFields = normalizeAdditionalFields(data.additionalFields);
      }
      
      console.log("Job data loaded with normalized additionalFields:", data);
      setJobData(data);
      
      try {
        // Generate standard preview format upon loading
        const preview = formatJobPreview(data);
        setFormattedPreview(preview);
      } catch (formattingError) {
        console.error("Error formatting job preview:", formattingError);
        toast({
          title: "Warning",
          description: "Job loaded but there was an issue formatting the preview",
          variant: "default",
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading job description:", error);
      toast({
        title: "Error",
        description: "Failed to load job description",
        variant: "destructive",
      });
      onClose();
    }
  };

  // Format helper function
  const formatTextWithBullets = (text: string): string => {
    // Safely handle null/undefined/non-string values
    if (!text) return '';
    if (typeof text !== 'string') {
      try {
        // Try to convert to string if possible
        text = String(text);
      } catch (e) {
        return '';
      }
    }
    
    try {
      // Case 1: Text already contains bullet points
      if (text.includes('•')) {
        // Split by newlines and convert to proper HTML list
        const lines = text.split('\n').filter(line => line.trim() !== '');
        return `<ul class="bullet-list">${
          lines.map(line => {
            line = line.trim();
            // If line starts with bullet, make it a list item
            if (line.startsWith('•')) {
              return `<li>${line.substring(1).trim()}</li>`;
            }
            return `<li>${line}</li>`;
          }).join('')
        }</ul>`;
      }
      
      // Case 2: Text contains comma-separated items (from array conversion)
      if (text.includes(',') && !text.includes('.') && text.length < 500) {
        const items = text.split(',').map(item => item.trim()).filter(item => item);
        return `<ul class="bullet-list">${
          items.map(item => `<li>${item}</li>`).join('')
        }</ul>`;
      }
      
      // Case 3: Regular text, just wrap in paragraphs
      return `<p>${text.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    } catch (error) {
      console.error('Error formatting text with bullets:', error);
      // Return original text wrapped in paragraph if any error occurs
      return `<p>${text}</p>`;
    }
  };

  // Standard format for job preview
  const formatJobPreview = (job: JobDescription): string => {
    if (!job) {
      console.error('No job data provided to formatJobPreview');
      return '<div class="p-4">No job data available.</div>';
    }

    try {
      // Format the job header section
      const jobHeaderSection = `
        <div class="job-preview-header">
          <h1 class="job-title">${job.jobTitle || 'Untitled Position'}</h1>
          <div class="job-meta">
            ${job.department ? `<span class="company-name">${job.department}</span>` : ''}
            ${job.location ? `<span class="location">${job.location}</span>` : ''}
            ${job.jobType ? `<span class="job-type">${job.jobType}</span>` : ''}
          </div>
        </div>
      `;

      // Format the main content with safe access
      const mainContent = `
        <div class="job-preview-content">
          ${job.aboutCompany ? `
          <div class="content-section">
            <h2>About Us</h2>
            <div>${formatTextWithBullets(job.aboutCompany)}</div>
          </div>` : ''}

          ${job.positionSummary ? `
          <div class="content-section">
            <h2>Job Description</h2>
            <div>${formatTextWithBullets(job.positionSummary)}</div>
          </div>` : ''}
          
          ${job.keyResponsibilities ? `
          <div class="content-section">
            <h2>Key Responsibilities</h2>
            <div>${formatTextWithBullets(job.keyResponsibilities)}</div>
          </div>` : ''}

          ${job.requiredSkills ? `
          <div class="content-section">
            <h2>Requirements</h2>
            <h3>Required Skills:</h3>
            <div>${formatTextWithBullets(job.requiredSkills)}</div>
            ${job.preferredSkills ? `<h3>Preferred Skills:</h3><div>${formatTextWithBullets(job.preferredSkills)}</div>` : ''}
          </div>` : ''}

          ${job.location ? `
          <div class="content-section">
            <h2>Work Location</h2>
            <div>${job.location}</div>
          </div>` : ''}

          ${job.workEnvironment ? `
          <div class="content-section">
            <h2>Work Environment</h2>
            <div>${formatTextWithBullets(job.workEnvironment)}</div>
          </div>` : ''}

          ${job.compensation ? `
          <div class="content-section">
            <h2>Compensation</h2>
            <div>${formatTextWithBullets(job.compensation)}</div>
          </div>` : ''}

          ${job.diversityStatement ? `
          <div class="content-section">
            <h2>Diversity Statement</h2>
            <div>${formatTextWithBullets(job.diversityStatement)}</div>
          </div>` : ''}

          <div class="content-section">
            <h2>How to Apply</h2>
            <div>${job.applicationInstructions ? formatTextWithBullets(job.applicationInstructions) : 'Apply through our platform.'}</div>
          </div>
          
          ${job.additionalFields && typeof job.additionalFields === 'object' && Object.keys(job.additionalFields).length > 0 ? `
          <div class="content-section">
            <h2>Additional Information</h2>
            ${Object.entries(job.additionalFields).map(([key, value]) => `
              <div class="mb-3">
                <h3>${key}:</h3>
                <div>${formatTextWithBullets(value as string)}</div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>
      `;

      // Combine everything into a complete preview (without the inline styles)
      return `
        <div class="job-preview-container">
          ${jobHeaderSection}
          ${mainContent}
        </div>
      `;
    } catch (error) {
      console.error('Error in formatJobPreview:', error);
      return `
        <div class="p-6 bg-red-50 border border-red-100 rounded-md text-center">
          <p class="text-red-600">There was an error formatting the job description.</p>
          <p class="text-sm text-red-500 mt-2">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  };

  // Event handlers
  const handlePublishClick = () => {
    setShowConfirmDialog(true);
  };

  // First step confirmation - platform selection
  const handleProceedToFinalConfirm = () => {
    // Check if at least one platform is selected
    const platformsSelected = selectedPlatforms.indeed || selectedPlatforms.linkedin;
    if (!platformsSelected) {
      toast({
        title: "Selection Required",
        description: "Please select at least one platform to publish your job",
        variant: "destructive",
      });
      return;
    }
    
    // Close the platform selection dialog and show the final confirmation
    setShowConfirmDialog(false);
    setShowFinalConfirmDialog(true);
  };

  // Final confirmation - actual publishing
  const handleConfirmPublish = async () => {
    if (!jobData) return;
    
    setPublishingJob(true);
    setPublishError(null);
    
    try {
      // Create an array of platforms to publish to
      const platformsToPublish: Platform[] = [];
      if (selectedPlatforms.indeed) platformsToPublish.push("indeed");
      if (selectedPlatforms.linkedin) platformsToPublish.push("linkedin");
      
      // Publish to each selected platform
      const publishPromises = platformsToPublish.map(platform => 
        publishJob({
          jobId: jobId,
          platform: platform,
          formattedContent: formattedPreview
        })
      );
      
      const results = await Promise.all(publishPromises);
      
      // Check if all publishing operations were successful
      const allSuccessful = results.every((result: PublishJobResult) => result.success);
      
      if (allSuccessful) {
        console.log(`All publishing operations successful, updating job status to Published`);
        
        // Update job status to Published
        try {
          await updateJobDescriptionApproveStatus(jobId, { status: "Published" });
          console.log(`Successfully updated job ${jobId} status to Published`);
          
          // Reload job data to get the updated status
          const updatedJob = await getJobDescriptionById(jobId);
          setJobData(updatedJob);
          
          toast({
            title: "Success!",
            description: `Job posted successfully to ${platformsToPublish.length > 1 ? 'multiple platforms' : platformsToPublish[0]}`,
            variant: "default",
          });
        } catch (statusError) {
          console.error(`Failed to update job status:`, statusError);
          toast({
            title: "Warning: Publishing Succeeded, Status Update Failed",
            description: "Your job was published successfully, but we couldn't update its status. Please try refreshing.",
            variant: "default",
          });
        }
        
        setShowFinalConfirmDialog(false);
        if (onFormatSuccess) {
          onFormatSuccess();
        }
        onClose();
      } else {
        // Find the first error
        const firstError = results.find((result: PublishJobResult) => !result.success);
        throw new Error(firstError?.error || "Failed to publish to one or more platforms");
      }
    } catch (error) {
      console.error(`Failed to publish job:`, error);
      setPublishError(error instanceof Error ? error.message : "Failed to publish job");
      
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : `An error occurred while publishing`,
        variant: "destructive",
      });
      
      setShowFinalConfirmDialog(false);
    } finally {
      setPublishingJob(false);
    }
  };

  const handleCancelPublish = () => {
    setShowConfirmDialog(false);
  };
  
  const handleCancelFinalConfirm = () => {
    setShowFinalConfirmDialog(false);
    setShowConfirmDialog(true); // Go back to platform selection
  };

  const handlePlatformToggle = (platform: keyof typeof selectedPlatforms) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  // Get text representation of selected platforms
  const getSelectedPlatformsText = () => {
    const platforms = [];
    if (selectedPlatforms.indeed) platforms.push("Indeed");
    if (selectedPlatforms.linkedin) platforms.push("LinkedIn");
    
    return platforms.length > 1 
      ? `${platforms.join(" and ")}`
      : platforms[0];
  };

  return {
    // State
    isLoading,
    jobData,
    formattedPreview,
    showConfirmDialog,
    showFinalConfirmDialog,
    selectedPlatforms,
    publishingJob,
    publishError,
    canFormatJobs,
    
    // Actions
    handlePublishClick,
    handleProceedToFinalConfirm,
    handleConfirmPublish,
    handleCancelPublish,
    handleCancelFinalConfirm,
    handlePlatformToggle,
    getSelectedPlatformsText,
    formatTextWithBullets,
    formatJobPreview
  };
};