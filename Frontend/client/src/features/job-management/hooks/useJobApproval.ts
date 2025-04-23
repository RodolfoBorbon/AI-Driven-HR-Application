import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useToast } from "@/shared/hooks/use-toast";
import { updateJobDescriptionApproveStatus } from "../api/jobDescriptionAPIs";

interface UseJobApprovalOptions {
  jobId: string;
  onApproveSuccess?: () => void;
  onClose: () => void;
  fieldWarnings?: Record<string, string>;
}

export function useJobApproval({
  jobId,
  onApproveSuccess,
  onClose,
  fieldWarnings = {}
}: UseJobApprovalOptions) {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if the user has permission to approve jobs
  const canApproveJobs = hasPermission("canApproveJobs");

  const openApproveDialog = () => {
    // Check if there are any warnings before showing the approval dialog
    if (Object.keys(fieldWarnings).length > 0) {
      toast({
        title: "Cannot Approve",
        description: "Please fix all empty fields before approving",
        variant: "destructive",
      });
      return;
    }
    
    setShowApproveConfirm(true);
  };
  
  const closeApproveDialog = () => {
    setShowApproveConfirm(false);
  };
  
  const handleApprove = async () => {
    // If user doesn't have permission, don't proceed
    if (!canApproveJobs) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to approve job descriptions",
        variant: "destructive",
      });
      onClose();
      return;
    }
    
    // Check for field warnings again as a safety measure
    if (Object.keys(fieldWarnings).length > 0) {
      toast({
        title: "Cannot Approve",
        description: "Please fix all empty fields before approving",
        variant: "destructive",
      });
      setShowApproveConfirm(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the job status to approved
      await updateJobDescriptionApproveStatus(jobId, {
        status: "Approved",
        approvalComments: comments
      });
      
      toast({
        title: "Success",
        description: "Job description has been approved successfully",
        duration: 3000,
      });
      
      if (onApproveSuccess) {
        onApproveSuccess();
      }
      
      closeApproveDialog();
      onClose();
    } catch (error) {
      console.error("Error approving job:", error);
      toast({
        title: "Error",
        description: "Failed to approve the job description",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Permission denial component props
  const permissionDeniedProps = {
    isPermissionDenied: !canApproveJobs,
    message: "You don't have permission to approve job descriptions. This action requires HR Manager or IT Admin privileges."
  };

  return {
    canApproveJobs,
    showApproveConfirm,
    comments,
    isSubmitting,
    setComments,
    openApproveDialog,
    closeApproveDialog,
    handleApprove,
    permissionDeniedProps
  };
}