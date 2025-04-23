import { useState, useRef, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useToast } from "@/shared/hooks/use-toast";
import { 
  JobDescription, 
  BiasAnalysisRequest, 
  BiasAnalysisOption, 
  ActiveFields, 
  CustomField,
  CreateJobDescriptionFormProps,
  BiasAnalysisResponse,
  UseCreateJobDescriptionProps
} from '@/features/job-management/types/createJobDescriptionInterfaces';
import { 
  createJobDescription, 
  analyzeBias, 
  updateJobDescription, 
  getJobAutoComplete 
} from '@/features/job-management/api/jobDescriptionAPIs';
import axios from "axios";
import * as z from "zod";
import { jobFormSchema, JobFormData } from "../types/createJobDescriptionSchemas"; // Import from formSchemas.ts
import { Resolver } from "react-hook-form";

// Moved from CreateJobDescriptionForm.tsx
const createCustomResolver = (activeFields: ActiveFields): Resolver<JobFormData> => {
  return async (values) => {
    const schema = z.object({
      jobTitle: z.string().min(1, "Job title is required"),
      department: z.string().min(1, "Department is required"),
      location: z.string().min(1, "Location is required"),
      jobType: z.string().min(1, "Job type is required"),
      status: z.string().default("Pending for Approval"),
      aboutCompany: z.string().min(1, "Company description is required"),
      positionSummary: z.string().min(1, "Position summary is required"),
      keyResponsibilities: activeFields.keyResponsibilities ? z.string().min(1, "Key responsibilities are required") : z.string().optional(),
      requiredSkills: activeFields.requiredSkills ? z.string().min(1, "Required skills are required") : z.string().optional(),
      preferredSkills: activeFields.preferredSkills ? z.string().min(1, "Preferred skills are required") : z.string().optional(),
      compensation: activeFields.compensation ? z.string().min(1, "Compensation is required") : z.string().optional(),
      workEnvironment: activeFields.workEnvironment ? z.string().min(1, "Work environment is required") : z.string().optional(),
      diversityStatement: activeFields.diversityStatement ? z.string().min(1, "Diversity statement is required") : z.string().optional(),
      applicationInstructions: activeFields.applicationInstructions ? z.string().min(1, "Application instructions are required") : z.string().optional(),
      contactInformation: activeFields.contactInformation ? z.string().min(1, "Contact information is required") : z.string().optional(),
      additionalInformation: activeFields.additionalInformation ? z.string().min(1, "Additional information is required") : z.string().optional(),
      additionalFields: z.record(z.string()).optional(),
    });

    try {
      const data = schema.parse(values);
      return { values: data, errors: {} };
    } catch (e) {
      return { values: {}, errors: (e as z.ZodError).formErrors.fieldErrors };
    }
  };
};

export function useCreateJobDescription({
  isOpen,
  onClose,
  isEditMode,
  initialData,
  jobId,
  onUpdateSuccess
}: UseCreateJobDescriptionProps) {
  // Core form states
  const [isPending, setIsPending] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  // Field control states
  const [activeFields, setActiveFields] = useState<ActiveFields>({
    keyResponsibilities: true,
    requiredSkills: true,
    preferredSkills: true,
    compensation: true,
    workEnvironment: true,
    diversityStatement: true,
    applicationInstructions: true,
    contactInformation: true,
    additionalInformation: true,
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Bias analysis states
  const [biasAnalysis, setBiasAnalysis] = useState<Record<string, BiasAnalysisOption>>({});
  const [showingBiasAnalysis, setShowingBiasAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSelectedRecommendations, setHasSelectedRecommendations] = useState(false);
  const [hasRecommendationSelected, setHasRecommendationSelected] = useState(false);
  const [noBiasFound, setNoBiasFound] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);

  // Dialog control states
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [showApprovalButtons, setShowApprovalButtons] = useState(false);

  // Form data states
  const [submittedData, setSubmittedData] = useState<JobFormData | null>(null);

  // Autocomplete states
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const jobTitleRef = useRef<string>("");

  // Field interactions
  const [fieldInteractions, setFieldInteractions] = useState<Record<string, boolean>>({
    jobTitle: true,
    positionSummary: true,
    keyResponsibilities: true,
    requiredSkills: true,
    preferredSkills: true,
  });
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // Notifications
  const { toast } = useToast();

  // Form initialization
  const createForm = useForm<JobFormData>({
    resolver: createCustomResolver(activeFields),
    defaultValues: {
      jobTitle: "",
      department: "",
      location: "",
      jobType: "",
      status: "Pending for Approval",
      aboutCompany: "",
      positionSummary: "",
      keyResponsibilities: "",
      requiredSkills: "",
      preferredSkills: "",
      compensation: "",
      workEnvironment: "",
      diversityStatement: "",
      applicationInstructions: "",
      contactInformation: "",
      additionalInformation: "",
      additionalFields: {},
    },
  });

  // Initialize form with initial data when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Reset the form with initial data
      createForm.reset({
        ...initialData,
        keyResponsibilities: initialData.keyResponsibilities || '',
        requiredSkills: initialData.requiredSkills || '',
        preferredSkills: initialData.preferredSkills || '',
        compensation: initialData.compensation || '',
        workEnvironment: initialData.workEnvironment || '',
        diversityStatement: initialData.diversityStatement || '',
        applicationInstructions: initialData.applicationInstructions || '',
        contactInformation: initialData.contactInformation || '',
        additionalInformation: initialData.additionalInformation || '',
      });

      // Mark all fields as interacted with in edit mode to prevent warnings
      setFieldInteractions({
        jobTitle: true,
        positionSummary: true,
        keyResponsibilities: true,
        requiredSkills: true,
        preferredSkills: true,
      });
      
      // Set createdJobId for use in bias analysis
      if (jobId) {
        setCreatedJobId(jobId);
      }

      if (initialData.additionalFields) {
        const customFieldsArray = Object.entries(initialData.additionalFields).map(
          ([label, value], index) => ({
            id: `custom-${index + 1}`,
            label,
            value: value as string,
            isActive: true,
          })
        );
        setCustomFields(customFieldsArray);
      }
    }
  }, [isEditMode, initialData, jobId, createForm]);

  // Helper Methods
  const formatBiasAnalysis = (analysisResponse: BiasAnalysisResponse, formData: JobFormData) => {
    const formattedAnalysis: Record<string, BiasAnalysisOption> = {};
    
    if (analysisResponse.success && analysisResponse.recommendations) {
      Object.entries(analysisResponse.recommendations).forEach(([field, result]) => {
        if (result.hasBias && result.suggestions?.length > 0) {
          const originalValue = formData[field as keyof JobFormData] as string;
          
          formattedAnalysis[field] = {
            original: originalValue,
            alternative: result.suggestions.join('\n'), // Use full corrected text
            selected: null
          };
        }
      });
    }
    
    return formattedAnalysis;
  };

  // Form Methods
  const onSubmit = async (data: JobFormData) => {
    // Check if user has interacted with fields that were auto-filled
    const jobTitle = createForm.getValues("jobTitle");
    const requiredInteractions = ["positionSummary", "keyResponsibilities", "requiredSkills"];
    
    // Check if job title is entered and we need to verify interaction with auto-completed fields
    if (jobTitle && jobTitleRef.current !== "" && !isEditMode) {
      const needsInteraction = requiredInteractions.some(field => !fieldInteractions[field]);
      
      if (needsInteraction) {
        setHasTriedSubmit(true); // This will trigger the warning messages
        
        toast({
          title: "Review Required",
          description: "Please click into the highlighted fields to review AI-generated content before submitting",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
    }
    
    setIsPending(true);
    console.log("Form submission started - Mode:", isEditMode ? "Update" : "Create");
  
    try {
      let jobResult;
      
      // Different handling based on whether we're editing or creating
      if (isEditMode && jobId) {
        // UPDATE EXISTING JOB
        console.log(`Updating existing job with ID: ${jobId}`);
        
        // Preserve the job ID when updating
        const updatedJobData = {
          ...data,
          // Make sure we don't override the ID or other critical fields
          id: jobId
        };
        
        jobResult = await updateJobDescription(jobId, updatedJobData);
        
        if (jobResult) {
          toast({
            title: "Success",
            description: "Job description updated successfully.",
            variant: "default",
          });
          
          // Make sure we're setting the correct job ID
          setCreatedJobId(jobId);
        }
      } else {
        // CREATE NEW JOB
        console.log("Creating new job description");
        
        // Create a job description object using the JobDescription interface
        const jobDescription: JobDescription = {
          id: "", // This will be set by the backend
          jobTitle: data.jobTitle.trim(),
          department: data.department.trim(),
          location: data.location.trim(),
          jobType: data.jobType.trim(),
          status: "Pending for Approval", // Default status
          aboutCompany: data.aboutCompany.trim(),
          positionSummary: data.positionSummary.trim(),
          // Convert any potential array types to strings
          keyResponsibilities: Array.isArray(data.keyResponsibilities) 
            ? data.keyResponsibilities.join('\n') 
            : (data.keyResponsibilities || ""),
          requiredSkills: Array.isArray(data.requiredSkills) 
            ? data.requiredSkills.join('\n') 
            : (data.requiredSkills || ""),
          preferredSkills: Array.isArray(data.preferredSkills) 
            ? data.preferredSkills.join('\n') 
            : (data.preferredSkills || ""),
          compensation: data.compensation || "",
          workEnvironment: data.workEnvironment || "",
          diversityStatement: data.diversityStatement || "",
          applicationInstructions: data.applicationInstructions || "",
          contactInformation: data.contactInformation || "",
          additionalInformation: data.additionalInformation || "",
          additionalFields: customFields.reduce((acc, field) => {
            if (field.isActive) {
              acc[field.label] = field.value;
            }
            return acc;
          }, {} as Record<string, string>),
        };
  
        console.log("Sending data to API:", jobDescription);
        jobResult = await createJobDescription(jobDescription as Required<JobDescription>);
        console.log("Received result from API:", jobResult);
        
        if (jobResult && jobResult.id) {
          toast({
            title: "Success",
            description: "Job description created successfully.",
            variant: "default",
          });
          
          setCreatedJobId(jobResult.id);
        } else {
          console.error("Missing ID in API response:", jobResult);
          throw new Error("API response missing ID field");
        }
      }
      
      if (jobResult) {
        // Important: We need to update these states for both create and update modes
        setSubmittedData(jobResult);
        setIsCreated(true);  // This enables the bias analysis button
        setShowingBiasAnalysis(false);
        setHasSelectedRecommendations(false);
        console.log("Job operation succeeded, setting isCreated to true");
        
        // Update the form with the latest data
        createForm.reset(jobResult);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("API Error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to save job description. Please try again.";
  
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Custom Fields Methods
  const addCustomField = () => {
    if (isCreated) return;
    const newId = `custom-${customFields.length + 1}`;
    setCustomFields((prev) => [
      ...prev,
      { id: newId, label: "", value: "", isActive: true },
    ]);
  };

  const removeCustomField = (id: string) => {
    if (isCreated) return;
    setCustomFields((prev) => prev.filter((field) => field.id !== id));
  };

  const toggleFieldActive = (fieldName: string) => {
    setActiveFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  // Track field interactions
  const markFieldInteracted = (fieldName: string) => {
    setFieldInteractions(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  // Bias Analysis Methods
  const handleBiasAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const formData = createForm.getValues();
      
      // Use the jobId from props if in edit mode, otherwise use createdJobId
      const currentJobId = isEditMode ? jobId : createdJobId;
      
      if (!currentJobId) {
        throw new Error("Job ID is missing");
      }
      
      console.log(`Analyzing bias for job with ID: ${currentJobId}`);
      
      const analysisRequest: BiasAnalysisRequest = {
        id: currentJobId,
        contextFields: {
          jobTitle: formData.jobTitle,
          department: formData.department,
          location: formData.location,
          jobType: formData.jobType,
          positionSummary: formData.positionSummary,
        },
        fieldsToAnalyze: {
          keyResponsibilities: formData.keyResponsibilities || '',
          requiredSkills: formData.requiredSkills || '',
          preferredSkills: formData.preferredSkills || '',
          compensation: formData.compensation || '',
          workEnvironment: formData.workEnvironment || '',
          diversityStatement: formData.diversityStatement || '',
          applicationInstructions: formData.applicationInstructions || '',
          contactInformation: formData.contactInformation || '',
          additionalInformation: formData.additionalInformation || '',
          additionalFields: JSON.stringify(formData.additionalFields || {}),
        }
      };
  
      const analysisResults = await analyzeBias(analysisRequest);
      const formattedResults = formatBiasAnalysis(analysisResults, formData);
      
      setBiasAnalysis(formattedResults);
      setShowingBiasAnalysis(Object.keys(formattedResults).length > 0);
      setNoBiasFound(Object.keys(formattedResults).length === 0);
      
      if (Object.keys(formattedResults).length === 0) {
        setShowApprovalButtons(true);
      }
  
      toast({
        title: "Analysis Complete",
        description: Object.keys(formattedResults).length > 0 
          ? "Review AI recommendations for potential bias"
          : "No significant bias detected",
        variant: "default",
      });
  
    } catch (error) {
      console.error("Bias analysis error:", error);
      toast({
        title: "Error",
        description: "Failed to analyze bias",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBiasOptionSelect = (
    field: string,
    option: "original" | "alternative" | null,
  ) => {
    setBiasAnalysis((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        selected: option,
      },
    }));
    setHasRecommendationSelected(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Apply selected bias changes to the form data
      Object.entries(biasAnalysis).forEach(([field, option]) => {
        if (option.selected) {
          const value = option.selected === 'original' ? option.original : option.alternative;
          createForm.setValue(field as keyof JobFormData, value);
        }
      });

      // Use the jobId from props if in edit mode, otherwise use createdJobId
      const currentJobId = isEditMode ? jobId : createdJobId;
      
      if (!currentJobId) {
        throw new Error("Job ID is missing");
      }
      
      console.log(`Saving changes to job with ID: ${currentJobId}`);
      
      // IMPORTANT: Get the current form data
      const formData = createForm.getValues();
      
      // Explicitly construct additionalFields from customFields state
      // This is the key fix - we always use the current customFields state 
      // rather than what might be in the form data
      const additionalFieldsData = customFields.reduce((acc, field) => {
        if (field.isActive && field.label && field.label.trim() !== '') {
          acc[field.label] = field.value || '';
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Log custom fields to verify
      console.log("Custom fields being preserved:", customFields);
      console.log("Formatted additionalFields:", additionalFieldsData);
      
      // Make sure we're preserving the job ID and additionalFields
      const updatedData = {
        ...formData,
        id: currentJobId,
        // Always use our explicitly constructed additionalFields
        additionalFields: additionalFieldsData
      };
      
      console.log("Final update payload with preserved additionalFields:", updatedData);
      
      const result = await updateJobDescription(currentJobId, updatedData);
      
      // Update form with result to keep additionalFields in sync
      createForm.reset(result);
      
      // Keep these state updates to move to the next step
      setShowingBiasAnalysis(false);
      setHasSelectedRecommendations(true);
      setShowApprovalButtons(true);

      toast({
        title: "Success",
        description: "Changes saved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error", 
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Form Close Methods
  const handleCloseForm = () => {
    // Reset the form values
    createForm.reset({
      jobTitle: "",
      department: "",
      location: "",
      jobType: "",
      status: "Pending for Approval",
      aboutCompany: "",
      positionSummary: "",
      keyResponsibilities: "",
      requiredSkills: "",
      preferredSkills: "",
      compensation: "",
      workEnvironment: "",
      diversityStatement: "",
      applicationInstructions: "",
      contactInformation: "",
      additionalInformation: "",
      additionalFields: {},
    });
  
    // Reset the reference to the job title
    jobTitleRef.current = "";
  
    // Reset field interactions tracking
    setFieldInteractions({
      jobTitle: false,
      positionSummary: false,
      keyResponsibilities: false,
      requiredSkills: false,
      preferredSkills: false,
    });
  
    // Reset all other state variables
    setCustomFields([]);
    setActiveFields({
      keyResponsibilities: true,
      requiredSkills: true,
      preferredSkills: true,
      compensation: true,
      workEnvironment: true,
      diversityStatement: true,
      applicationInstructions: true,
      contactInformation: true,
      additionalInformation: true,
    });
    setShowingBiasAnalysis(false);
    setBiasAnalysis({});
    setIsCreated(false);
    setSubmittedData(null);
    setIsAnalyzing(false);
    setHasSelectedRecommendations(false);
    setShowApprovalDialog(false);
    setHasRecommendationSelected(false);
    setHasFormChanges(false);
    setShowApprovalButtons(false);
    setNoBiasFound(false);
    setCreatedJobId(null);
    setHasTriedSubmit(false);
    onClose();
  };

  // Approval Methods
  const handleApprovalConfirmed = async () => {
    try {
      const formData = createForm.getValues();
      
      // Use the jobId from props if in edit mode, otherwise use createdJobId
      const currentJobId = isEditMode ? jobId : createdJobId;
      
      if (!currentJobId) {
        throw new Error("Job ID is missing");
      }
      
      console.log(`Updating status for job with ID: ${currentJobId}`);
      
      const updatedData = {
        ...formData,
        status: "Pending for Approval",
        id: currentJobId // Preserve the ID
      };

      await updateJobDescription(currentJobId, updatedData);
      setShowApprovalConfirm(false);
      
      toast({
        title: "Success",
        description: "Job description has been sent for approval.",
        variant: "default",
      });

      // Only now do we call onUpdateSuccess if we're in edit mode
      if (isEditMode && onUpdateSuccess) {
        onUpdateSuccess();
      }

      handleCloseForm();
    } catch (error) {
      console.error("Error during approval:", error);
      toast({
        title: "Error",
        description: "Failed to send job description for approval.",
        variant: "destructive",
      });
    }
  };

  // Auto-complete handling
  const handleJobTitleAutoComplete = async () => {
    // Skip auto-complete entirely if in edit mode
    if (isEditMode) {
      return;
    }

    const jobTitle = createForm.getValues("jobTitle");
    
    // Skip if no job title or already auto-completing
    if (!jobTitle || jobTitle === jobTitleRef.current || isAutoCompleting || isCreated) {
      return;
    }
    
    setIsAutoCompleting(true);
    jobTitleRef.current = jobTitle;
    
    try {
      const results = await getJobAutoComplete(jobTitle);
      
      if (results.success && results.data) {
        // Flag to track if we've actually populated any fields with AI content
        let fieldsPopulated = false;
        
        // Only update fields that have content
        if (results.data.positionSummary) {
          createForm.setValue("positionSummary", results.data.positionSummary);
          fieldsPopulated = true;
        }
        
        // Format key responsibilities as bullet points if it's an array
        if (results.data.keyResponsibilities) {
          const formattedResponsibilities = Array.isArray(results.data.keyResponsibilities)
            ? results.data.keyResponsibilities.map(item => `• ${item}`).join('\n')
            : results.data.keyResponsibilities;
          createForm.setValue("keyResponsibilities", formattedResponsibilities);
          fieldsPopulated = true;
        }
        
        // Format required skills as bullet points if it's an array
        if (results.data.requiredSkills) {
          const formattedRequiredSkills = Array.isArray(results.data.requiredSkills)
            ? results.data.requiredSkills.map(item => `• ${item}`).join('\n')
            : results.data.requiredSkills;
          createForm.setValue("requiredSkills", formattedRequiredSkills);
          fieldsPopulated = true;
        }
        
        // Format preferred skills as bullet points if it's an array
        if (results.data.preferredSkills) {
          const formattedPreferredSkills = Array.isArray(results.data.preferredSkills)
            ? results.data.preferredSkills.map(item => `• ${item}`).join('\n')
            : results.data.preferredSkills;
          createForm.setValue("preferredSkills", formattedPreferredSkills);
          fieldsPopulated = true;
        }
        
        // Set form changes flag to true
        setHasFormChanges(true);
        
        // Only show notification and set interaction flags if we actually populated fields
        if (fieldsPopulated) {
          toast({
            title: "Fields Auto-Completed",
            description: `AI recommendations have been applied. Please review the content.`,
            variant: "default",
          });
          
          // Mark all fields initially as reviewed to prevent immediate warnings
          setFieldInteractions(prev => ({
            ...prev,
            positionSummary: true,
            keyResponsibilities: true,
            requiredSkills: true,
            preferredSkills: true
          }));
          
          // After a delay, mark fields as needing review if they were auto-filled
          const timeoutId = setTimeout(() => {
            // Fix TypeScript errors by adding optional chaining and proper type checking
            const filledFields = {
              positionSummary: !!results.data?.positionSummary,
              keyResponsibilities: !!results.data?.keyResponsibilities,
              requiredSkills: !!results.data?.requiredSkills,
              preferredSkills: !!results.data?.preferredSkills
            };
            
            setFieldInteractions(prev => ({
              ...prev,
              positionSummary: !filledFields.positionSummary ? prev.positionSummary : false,
              keyResponsibilities: !filledFields.keyResponsibilities ? prev.keyResponsibilities : false,
              requiredSkills: !filledFields.requiredSkills ? prev.requiredSkills : false,
              preferredSkills: !filledFields.preferredSkills ? prev.preferredSkills : false
            }));
            
            // Fix "warning" variant error - change to "destructive" which is supported
            toast({
              title: "Action Required",
              description: "Please review AI-generated content by clicking into each highlighted field",
              variant: "destructive",
              duration: 6000,
            });
          }, 2000); // Give users 3 seconds before showing the warning
          
          return () => clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      console.error("Auto-complete error:", error);
      
      // Check if this is a quota exceeded error
      const isQuotaError = 
        axios.isAxiosError(error) && 
        error.response?.status === 429;
      
      if (isQuotaError) {
        toast({
          title: "AI Service Unavailable",
          description: "The AI service quota has been exceeded. Please fill in the fields manually.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Auto-Complete Failed",
          description: "Could not retrieve job information. Please fill in the fields manually.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAutoCompleting(false);
    }
  };

  // Check if form has content
  const hasFormContent = () => {
    const jobTitle = createForm.getValues("jobTitle");
    return !!jobTitle && jobTitle.trim().length > 0;
  };

  // Return an object with all the states and handlers
  return {
    // Form
    createForm,
    onSubmit,
    isPending,
    isCreated,
    
    // Field management
    activeFields,
    toggleFieldActive,
    markFieldInteracted,
    fieldInteractions,
    hasTriedSubmit,
    
    // Custom fields
    customFields,
    addCustomField,
    removeCustomField,
    setCustomFields, // Add this line
    
    // Bias analysis
    biasAnalysis,
    showingBiasAnalysis,
    isAnalyzing,
    hasSelectedRecommendations,
    hasRecommendationSelected,
    noBiasFound,
    showApprovalButtons,
    handleBiasAnalysis,
    handleBiasOptionSelect,
    handleSaveChanges,
    setShowingBiasAnalysis, // Add this line
    setShowApprovalButtons, // Add this line
    
    // Dialog control
    showApprovalConfirm,
    setShowApprovalConfirm,
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    
    // Form actions
    handleCloseForm,
    handleApprovalConfirmed,
    
    // Job title auto-complete
    isAutoCompleting,
    handleJobTitleAutoComplete,
    
    // Utility
    hasFormContent,
    
    // Created job info
    createdJobId
  };
}