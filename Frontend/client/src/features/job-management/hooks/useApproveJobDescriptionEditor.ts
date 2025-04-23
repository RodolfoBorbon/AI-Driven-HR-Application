import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { getJobDescriptionById, updateJobDescriptionApproveStatus } from "../api/jobDescriptionAPIs";
import { JobDescription } from "../types/createJobDescriptionInterfaces";

export function useJobDescriptionEditor(jobId: string, isOpen: boolean) {
  const { toast } = useToast();
  const [jobData, setJobData] = useState<JobDescription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<JobDescription | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fields that shouldn't be editable
  const readOnlyFields = ["jobTitle", "department", "location", "jobType"];

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobData();
    }
  }, [isOpen, jobId]);

  const loadJobData = async () => {
    try {
      setIsLoading(true);
      const data = await getJobDescriptionById(jobId);
      
      console.log("Raw job data received:", data);
      
      // Process data to ensure all fields are handled correctly
      const processedData = {
        ...data,
        // Convert arrays to strings if they exist in the data
        keyResponsibilities: Array.isArray(data.keyResponsibilities) ? 
          data.keyResponsibilities.join('\n') : data.keyResponsibilities,
        requiredSkills: Array.isArray(data.requiredSkills) ? 
          data.requiredSkills.join('\n') : data.requiredSkills,
        preferredSkills: Array.isArray(data.preferredSkills) ? 
          data.preferredSkills.join('\n') : data.preferredSkills,
        // Normalize additionalFields to be a plain object
        additionalFields: normalizeAdditionalFields(data.additionalFields)
      };
      
      console.log("Processed additionalFields:", processedData.additionalFields);
      
      // Store original data for comparison
      setOriginalData({...processedData});
      
      // We only want warnings for fields that have been emptied, not ones that were already empty
      // So we'll start with no warnings
      setFieldWarnings({});
      setJobData(processedData);
      setError("");
    } catch (error) {
      console.error("Error loading job description:", error);
      setError("Failed to load job description");
      toast({
        title: "Error",
        description: "Failed to load job description",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified helper function to normalize additionalFields to a plain object
  const normalizeAdditionalFields = (fields: any): Record<string, string> => {
    console.log("Normalizing additionalFields:", fields, "Type:", typeof fields);
    
    // If it's undefined or null, return empty object
    if (!fields) return {};
    
    // If it's a Map object (from MongoDB)
    if (fields instanceof Map) {
      console.log("Converting Map to object");
      const obj: Record<string, string> = {};
      fields.forEach((value, key) => {
        obj[key] = String(value);
      });
      return obj;
    }
    
    // If it's already a plain object, return it
    if (typeof fields === 'object' && !Array.isArray(fields)) {
      // First check if it has entries method (Map-like)
      if (fields.entries && typeof fields.entries === 'function') {
        try {
          const obj: Record<string, string> = {};
          for (const [key, value] of fields.entries()) {
            obj[key] = String(value);
          }
          return obj;
        } catch (e) {
          console.warn("Failed to process entries:", e);
        }
      }
      
      // MongoDB special format with _kv field
      if (fields._kv || fields.kv) {
        const entries = fields._kv || fields.kv || [];
        const obj: Record<string, string> = {};
        for (const entry of entries) {
          if (entry && entry.k && entry.v !== undefined) {
            obj[entry.k] = String(entry.v);
          }
        }
        return obj;
      }
      
      // If it's a regular object with no special formats
      // Convert any values to strings to ensure consistency
      const obj: Record<string, string> = {};
      Object.entries(fields).forEach(([key, value]) => {
        if (key !== '_id' && key !== '__v' && !key.startsWith('$')) {
          obj[key] = String(value);
        }
      });
      return obj;
    }
    
    // If it's a string (possibly JSON string), try to parse it
    if (typeof fields === 'string') {
      try {
        const parsed = JSON.parse(fields);
        return normalizeAdditionalFields(parsed); // Recursively normalize the parsed result
      } catch (e) {
        console.warn("Failed to parse additionalFields string");
        return {};
      }
    }
    
    // Default case - return empty object
    console.warn("Unrecognized additionalFields format, returning empty object");
    return {};
  };

  const handleFieldChange = (field: keyof JobDescription, value: string | Record<string, string>) => {
    // Skip changes for read-only fields
    if (readOnlyFields.includes(field as string)) {
      return;
    }
    
    if (jobData && originalData) {
      const originalValue = originalData[field];
      
      // For additionalFields, handle differently since it's an object
      if (field === 'additionalFields') {
        // Ensure value is correctly typed as Record<string, string>
        if (typeof value === 'object') {
          setJobData(prev => {
            if (!prev) return null;
            return { ...prev, [field]: value as Record<string, string> };
          });
          setHasChanges(true);
        } else {
          console.error(`Expected object value for additionalFields, got:`, value);
        }
        return;
      }
      
      // For regular string fields, continue with the existing logic
      if (typeof value !== 'string') {
        console.error(`Expected string value for field ${field}, got:`, value);
        return;
      }
      
      // Check if this field originally had content
      const hadOriginalContent = 
        originalValue !== undefined && 
        originalValue !== null && 
        !(typeof originalValue === 'string' && originalValue.trim() === '') &&
        !(Array.isArray(originalValue) && originalValue.length === 0);
      
      // For fields that had original content, don't allow them to become empty
      if (hadOriginalContent && value.trim() === '') {
        // Show warning
        setFieldWarnings(prev => ({
          ...prev,
          [field]: "This field cannot be emptied. Please add content."
        }));
        
        // Auto-restore the previous valid value if current value is empty
        const currentValue = jobData[field];
        if (currentValue && typeof currentValue === 'string' && currentValue.trim() !== '') {
          // Keep the last valid value
          return;
        } else {
          // If somehow we got to an empty state, restore the original value
          setJobData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              [field]: originalValue
            };
          });
          
          toast({
            title: "Field Restored",
            description: "Fields cannot be emptied. Original content restored.",
            variant: "default",
          });
          
          return;
        }
      } else {
        // Clear warning if content is added
        setFieldWarnings(prev => {
          const newWarnings = { ...prev };
          delete newWarnings[field];
          return newWarnings;
        });
      }

      // Update field value for valid changes
      setJobData(prev => {
        if (!prev) return null;
        return { ...prev, [field]: value };
      });
      setHasChanges(true);
    }
  };

  const saveChanges = async () => {
    if (!jobData) return;
    
    // Check if there are any warnings before saving
    if (Object.keys(fieldWarnings).length > 0) {
      toast({
        title: "Cannot Save",
        description: "Please fix all empty fields before saving",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Make sure additionalFields is in the correct format for the API
      // Create a copy of jobData with proper formatting
      const formattedData = {
        ...jobData,
        // Convert additionalFields to the format expected by the API
        additionalFields: jobData.additionalFields || {}
      };
      
      console.log("Saving with formatted additionalFields:", formattedData.additionalFields);
      await updateJobDescriptionApproveStatus(jobId, formattedData);
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
      setHasChanges(false);
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    jobData,
    originalData,
    isLoading,
    isSaving,
    hasChanges,
    fieldWarnings,
    error,
    readOnlyFields,
    handleFieldChange,
    saveChanges,
    reloadJobData: loadJobData,
  };
}