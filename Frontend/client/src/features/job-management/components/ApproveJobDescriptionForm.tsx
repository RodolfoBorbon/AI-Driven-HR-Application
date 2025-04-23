import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { Save, CheckCircle2, FileCheck } from "lucide-react";
import { JobDescription } from "@/features/job-management/types/createJobDescriptionInterfaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useJobDescriptionEditor } from "../hooks/useApproveJobDescriptionEditor";
import { useJobApproval } from "../hooks/useJobApproval";
import { ApproveJobDescriptionFormProps } from "../types/approveJobDescriptionInterfaces";

export function ApproveJobDescriptionForm({
  isOpen,
  onClose,
  jobId,
  onApproveSuccess
}: ApproveJobDescriptionFormProps) {
  // Use the job data editor hook
  const {
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
  } = useJobDescriptionEditor(jobId, isOpen);
  
  // Use the job approval hook
  const {
    canApproveJobs,
    showApproveConfirm,
    comments,
    isSubmitting,
    setComments,
    openApproveDialog,
    closeApproveDialog,
    handleApprove,
    permissionDeniedProps
  } = useJobApproval({
    jobId,
    onApproveSuccess,
    onClose,
    fieldWarnings
  });
  
  // Keep the unsaved changes dialog state in the component
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  const handleSaveChanges = async () => {
    await saveChanges();
  };

  // If the user doesn't have permission, show an error message
  if (permissionDeniedProps.isPermissionDenied) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permission Denied</DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              {permissionDeniedProps.message}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Only handle closing events (when open becomes false)
          if (!open && isOpen) {
            // If user has made changes, show confirmation dialog
            if (hasChanges) {
              setShowUnsavedChangesDialog(true);
              return false; // Prevent dialog from closing
            } else {
              // If no changes, allow programmatic close but do it ourselves
              onClose();
            }
            return false; // Prevent automatic closing by returning false
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[725px] max-h-[80vh] overflow-y-auto overflow-x-hidden"
          onInteractOutside={(e) => e.preventDefault()} // Block all outside interactions
          onEscapeKeyDown={(e) => e.preventDefault()}   // Prevent closing with Escape key
        >
          <DialogHeader className="text-center pb-4 mb-2">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 mx-[-24px] mt-[-24px] pt-8 pb-6 border-b">
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <FileCheck className="h-7 w-7 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                  Approve Job Description
                </DialogTitle>
                <div className="h-1 w-16 bg-primary/30 rounded-full mt-3"></div>
              </div>
            </div>
            <div className="text-center text-muted-foreground mt-5 mx-auto max-w-md">
              <p className="text-sm font-medium">
                Please review all sections of the job description before approving. 
                Make any necessary edits.
              </p>
            </div>
          </DialogHeader>
  
          {Object.keys(fieldWarnings).length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Field content required:</strong> Fields that originally had content cannot be emptied. Please add content to highlighted fields.
                  </p>
                </div>
              </div>
            </div>
          )}
  
          {jobData && (
            <div className="grid gap-4 py-4 w-full" style={{ 
              wordBreak: "break-word", 
              overflowWrap: "break-word" 
            }}>
              {/* Required Fields */}
              <div className="grid gap-4 w-full">
                {Object.entries(jobData).map(([key, value]) => {
                  // Skip metadata and empty fields
                  if (
                    key === "id" || 
                    key === "status" || 
                    key === "_id" || 
                    key === "__v" || 
                    key === "createdAt" || 
                    key === "updatedAt" || 
                    key === "additionalFields" ||
                    (typeof value === "string" && !value.trim())
                  ) {
                    return null;
                  }
  
                  // Format the label
                  const formattedLabel = key.replace(/([A-Z])/g, " $1").trim();
                  
                  // Handle array values (convert to string if needed)
                  const displayValue = Array.isArray(value) ? value.join('\n') : value;
                  
                  return (
                    <div key={key} className="grid gap-2 w-full">
                      <Label htmlFor={key} className="font-medium capitalize">
                        {formattedLabel}
                      </Label>
                      {typeof displayValue === "string" && (
                        key === "aboutCompany" || 
                        key === "positionSummary" || 
                        key.includes("Skills") || 
                        key.includes("Responsibilities") ||
                        key === "compensation" ||
                        key === "workEnvironment" ||
                        key === "applicationInstructions" ||
                        key === "contactInformation" ||
                        key === "additionalInformation" ? (
                          <div className="space-y-1 w-full" style={{ 
                            wordBreak: "break-word", 
                            overflowWrap: "break-word",
                            maxWidth: "100%" 
                          }}>
                            <Textarea
                              id={key}
                              value={displayValue}
                              onChange={(e) => handleFieldChange(key as keyof JobDescription, e.target.value)}
                              className={`min-h-[100px] w-full resize-y ${readOnlyFields.includes(key) ? 'bg-muted cursor-not-allowed' : ''} ${fieldWarnings[key] ? 'border-red-500' : ''}`}
                              disabled={readOnlyFields.includes(key)}
                              style={{ width: "100%", maxWidth: "100%" }}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{displayValue.length > 0 ? `${displayValue.length} characters` : "Empty"}</span>
                              {originalData && originalData[key as keyof JobDescription] && typeof originalData[key as keyof JobDescription] === 'string' && (
                                <span className="truncate">Original: {(originalData[key as keyof JobDescription] as string).length} characters</span>
                              )}
                            </div>
                            {fieldWarnings[key] && (
                              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p className="text-sm break-words">{fieldWarnings[key]}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 w-full" style={{ 
                            wordBreak: "break-word", 
                            overflowWrap: "break-word",
                            maxWidth: "100%" 
                          }}>
                            <Input
                              id={key}
                              value={displayValue}
                              onChange={(e) => handleFieldChange(key as keyof JobDescription, e.target.value)}
                              className={`w-full ${readOnlyFields.includes(key) ? 'bg-muted cursor-not-allowed' : ''} ${fieldWarnings[key] ? 'border-red-500' : ''}`}
                              disabled={readOnlyFields.includes(key)}
                              style={{ width: "100%", maxWidth: "100%" }}
                            />
                            {fieldWarnings[key] && (
                              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p className="text-sm break-words">{fieldWarnings[key]}</p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Handle additionalFields as a special case */}
              {jobData.additionalFields && Object.keys(jobData.additionalFields).length > 0 && (
                <div className="grid gap-4 w-full border-t pt-4 mt-2">
                  <h3 className="font-medium text-lg">Additional Fields</h3>
                  {Object.entries(jobData.additionalFields).map(([label, value]) => (
                    <div key={`additional-${label}`} className="grid gap-2 w-full">
                      <Label htmlFor={`additional-${label}`} className="font-medium">
                        {label}
                      </Label>
                      <div className="space-y-1 w-full">
                        <Textarea
                          id={`additional-${label}`}
                          value={value as string}
                          onChange={(e) => {
                            // Create a new object with updated value
                            const newAdditionalFields = {
                              ...jobData.additionalFields,
                              [label]: e.target.value,
                            };
                            // Pass the entire updated additionalFields object
                            handleFieldChange('additionalFields', newAdditionalFields);
                          }}
                          className="min-h-[100px] w-full resize-y"
                          style={{ width: "100%", maxWidth: "100%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Job ID Display */}
              <div className="mt-4 p-4 border rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-medium">
                  Job Description ID: <span className="font-bold">{jobId}</span>
                </p>
              </div>
  
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                {hasChanges ? (
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isLoading || Object.keys(fieldWarnings).length > 0}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                    {Object.keys(fieldWarnings).length > 0 && (
                      <span className="text-xs">(Fix empty fields first)</span>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={openApproveDialog}
                    disabled={isLoading || Object.keys(fieldWarnings).length > 0}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                    {Object.keys(fieldWarnings).length > 0 && (
                      <span className="text-xs">(Fix empty fields first)</span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval confirmation dialog */}
      <AlertDialog open={showApproveConfirm} onOpenChange={closeApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this job description? 
              This action will change the status to "Approved".
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Add comments textarea */}
          <div className="py-2">
            <Label htmlFor="approval-comments" className="text-sm font-medium">
              Add approval comments (optional):
            </Label>
            <Textarea
              id="approval-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional notes for the approval"
              className="mt-1"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove} 
              disabled={isSubmitting}
              className="relative"
            >
              {isSubmitting && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
              <span className={isSubmitting ? "opacity-0" : ""}>Yes, Approve</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved changes warning dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to exit? All changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowUnsavedChangesDialog(false);
              onClose();
            }}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}