import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { 
  FileCheck,
  FilePlus, 
  Plus, 
  X, 
  Save, 
  SendHorizontal, 
  Undo2, 
  CheckCircle2, 
  Brain 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectValue } from "@/shared/components/ui/select";
import { ChevronDown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { 
  ActiveFields, 
  CustomField, 
  CreateJobDescriptionFormProps
} from '@/features/job-management/types/createJobDescriptionInterfaces';
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
import { SelectTrigger } from "@radix-ui/react-select";
import { Controller } from "react-hook-form";
import { useCreateJobDescription } from "../hooks/useCreateJobDescription";
import { JobFormData } from "../types/createJobDescriptionSchemas"; // Import the type from our new file

// Render fields that do not require bias analysis
const renderField = (
  fieldName: string, 
  label: string, 
  form: UseFormReturn<JobFormData>,
  activeFields: ActiveFields,
  isCreated: boolean,
  fieldInteractions: Record<string, boolean>,
  hasTriedSubmit: boolean,
  markFieldInteracted: (fieldName: string) => void,
  toggleFieldActive: (fieldName: string) => void
) => {
  const requiredFields = [
    "jobTitle",
    "department",
    "location",
    "jobType",
    "aboutCompany",
    "positionSummary",
  ];

  const isRequired = requiredFields.includes(fieldName) || activeFields[fieldName];
  
  // Update the condition to also check if the field had auto-completion
  const wasAutoCompleted = ["positionSummary", "keyResponsibilities", "requiredSkills", "preferredSkills"].includes(fieldName);
  
  // Show the warning if either the user tried to submit OR if this is an auto-completed field
  const needsReview = (hasTriedSubmit || wasAutoCompleted) && 
    !fieldInteractions[fieldName] && 
    ["positionSummary", "keyResponsibilities", "requiredSkills", "preferredSkills"].includes(fieldName);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor={fieldName} className="text-sm font-medium">
          {label} {isRequired && <span className="text-destructive">*</span>}
          {wasAutoCompleted && !fieldInteractions[fieldName] && (
            <span className="ml-2 text-amber-500 text-xs font-normal">(Review needed)</span>
          )}
        </Label>
        {!requiredFields.includes(fieldName) && (
          <Switch
            checked={activeFields[fieldName] ?? true}
            onCheckedChange={() => toggleFieldActive(fieldName)}
            disabled={isCreated}
          />
        )}
      </div>
      <Textarea
        id={fieldName}
        {...form.register(fieldName as keyof JobFormData, { required: isRequired })}
        className={needsReview ? "mt-2 border-amber-500 bg-amber-50/50" : "mt-2"}
        placeholder={`Enter ${label.toLowerCase()}...`}
        disabled={!activeFields[fieldName] && activeFields[fieldName] !== undefined || isCreated}
        onFocus={() => markFieldInteracted(fieldName)}
      />
      {form.formState.errors[fieldName as keyof JobFormData] && !needsReview && (
        <p className="text-sm text-destructive">
          {form.formState.errors[fieldName as keyof JobFormData]?.message?.toString() || 'Invalid input'}
        </p>
      )}
      {needsReview && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <p className="text-sm">
            <strong>Action required:</strong> Click into this AI-generated content to review it before submitting
          </p>
        </div>
      )}
    </div>
  );
};

export default function CreateJobDescriptionForm({ 
  isOpen, 
  onClose, 
  isEditMode = false, // Add default value to fix the TypeScript error
  initialData, 
  jobId,
  onUpdateSuccess
}: CreateJobDescriptionFormProps) {
  // Use our custom hook
  const {
    createForm,
    onSubmit,
    isPending,
    isCreated,
    activeFields,
    toggleFieldActive,
    markFieldInteracted,
    fieldInteractions,
    hasTriedSubmit,
    customFields,
    addCustomField,
    removeCustomField,
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
    showApprovalConfirm,
    setShowApprovalConfirm,
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    handleCloseForm,
    handleApprovalConfirmed,
    isAutoCompleting,
    handleJobTitleAutoComplete,
    hasFormContent,
    createdJobId,
    setShowingBiasAnalysis, // Add these setters from the hook
    setShowApprovalButtons, // Add these setters from the hook
    setCustomFields      // Add these setters from the hook
  } = useCreateJobDescription({
    isOpen,
    onClose,
    isEditMode,
    initialData,
    jobId,
    onUpdateSuccess
  });

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Only handle the closing event (when open changes from true to false)
          if (!open && isOpen) {
            // Check if there's content in the form that would be worth saving
            if (hasFormContent()) {
              setShowUnsavedChangesDialog(true);
              return false; // Prevent dialog from closing
            } else {
              // If no changes, allow programmatic close but still handle it ourselves
              handleCloseForm();
            }
            return false; // Prevent automatic closing by returning false
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[725px] max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()} // Block all outside interactions
          onEscapeKeyDown={(e) => e.preventDefault()}   // Prevent closing with Escape key
        >
          <DialogHeader className="text-center pb-4 mb-2">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 mx-[-24px] mt-[-24px] pt-8 pb-6 border-b">
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <FilePlus className="h-7 w-7 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                  {isEditMode ? "Update Job Description" : "Create Job Description"}
                </DialogTitle>
                <div className="h-1 w-16 bg-primary/30 rounded-full mt-3"></div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-5 text-center mx-auto max-w-md">
              {isEditMode 
                ? "Update the details for this job description. Required fields are marked with *."
                : "Fill in the details for the new job description. Required fields are marked with *."
              }
            </div>
          </DialogHeader>
          <form
            className="grid gap-4 py-4"
            onSubmit={createForm.handleSubmit(onSubmit)}
          >
            {isEditMode && (
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-2 flex items-center">
                <FileCheck className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    
                  </p>
                  <p className="text-xs text-blue-600">
                    You are updating an existing job description already published.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jobTitle" className="font-medium">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Software Engineer"
                  {...createForm.register("jobTitle")}
                  disabled={isCreated || isEditMode} // Disable in both created and edit modes
                  readOnly={isEditMode} // Make read-only in edit mode
                  onBlur={!isEditMode ? handleJobTitleAutoComplete : undefined} // Only attach auto-complete in create mode
                  className={`${isAutoCompleting ? "border-blue-600" : ""} ${isEditMode ? "bg-gray-100" : ""}`}
                />
                {isAutoCompleting && !isEditMode && (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <p className="text-xs text-primary flex items-center gap-1">
                      Auto-completing fields by AI service
                    </p>
                  </div>
                )}
                {isEditMode && (
                  <p className="text-xs text-muted-foreground">
                    Job title cannot be changed in update mode
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="department" className="font-medium">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="department"
                  placeholder="e.g. Engineering"
                  {...createForm.register("department")}
                  disabled={isCreated}
                />
                {createForm.formState.errors.department && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.department.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location" className="font-medium">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Toronto, ON (Remote/Hybrid/On-site)"
                  {...createForm.register("location")}
                  disabled={isCreated}
                />
                {createForm.formState.errors.location && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="jobType" className="font-medium">
                  Job Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="jobType"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      aria-label="Job Type"
                    >
                      <SelectTrigger className="h-10 border border-input bg-background px-3 py-2 text-sm rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2 text-left flex justify-between items-center">
                        <SelectValue placeholder="Select Job Type" />
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-Time" textValue="Full-Time">Full-Time</SelectItem>
                        <SelectItem value="Part-Time" textValue="Part-Time">Part-Time</SelectItem>
                        <SelectItem value="Contract" textValue="Contract">Contract</SelectItem>
                        <SelectItem value="Internship" textValue="Internship">Internship</SelectItem>
                        <SelectItem value="Co-op" textValue="Co-op">Co-op</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {createForm.formState.errors.jobType && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.jobType.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="aboutCompany" className="font-medium">
                  About the Company <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="aboutCompany"
                  placeholder="Provide a brief description of your company..."
                  {...createForm.register("aboutCompany")}
                  disabled={isCreated}
                />
                {createForm.formState.errors.aboutCompany && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.aboutCompany.message}
                  </p>
                )}
              </div>

              {renderField(
                "positionSummary", 
                "Position Summary", 
                createForm, 
                activeFields, 
                isCreated, 
                fieldInteractions, 
                hasTriedSubmit,
                markFieldInteracted,
                toggleFieldActive
              )}
            </div>

            <div className="space-y-4">
              {renderField("keyResponsibilities", "Key Responsibilities", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("requiredSkills", "Required Skills", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("preferredSkills", "Preferred Skills", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("compensation", "Compensation", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("workEnvironment", "Work Environment", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("diversityStatement", "Diversity Statement", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("applicationInstructions", "Application Instructions", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("contactInformation", "Contact Information", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}
              {renderField("additionalInformation", "Additional Information", createForm, activeFields, isCreated, fieldInteractions, hasTriedSubmit, markFieldInteracted, toggleFieldActive)}

              {!isCreated && customFields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 mr-4">
                      <Input
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) => {
                          setCustomFields((prev: CustomField[]) =>
                            prev.map((f: CustomField) =>
                              f.id === field.id
                                ? { ...f, label: e.target.value }
                                : f,
                            ),
                          );
                        }}
                        disabled={isCreated}
                      />
                    </div>
                    <Switch
                      checked={field.isActive}
                      onCheckedChange={(checked) => {
                        setCustomFields((prev: CustomField[]) =>
                          prev.map((f: CustomField) =>
                            f.id === field.id ? { ...f, isActive: checked } : f,
                          ),
                        );
                      }}
                      disabled={isCreated}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomField(field.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) => {
                      setCustomFields((prev: CustomField[]) =>
                        prev.map((f: CustomField) =>
                          f.id === field.id
                            ? { ...f, value: e.target.value }
                            : f,
                        ),
                      );
                    }}
                    disabled={!field.isActive || isCreated}
                  />
                </div>
              ))}

              {isCreated && customFields
                .filter((field) => field.isActive)
                .map((field) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <Label className="text-sm font-medium mb-2 block">
                      {field.label}
                    </Label>
                    <Input
                      value={field.value}
                      disabled={true}
                    />
                  </div>
                ))}

              {!isCreated && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomField}
                  className="gap-2 w-full hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Field
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t mt-6">
              <div className="flex justify-end gap-2">
                {!isCreated && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Check if there's content in the form that would be worth saving
                        if (hasFormContent()) {
                          setShowUnsavedChangesDialog(true);
                        } else {
                          // If form is empty, just close without warning
                          handleCloseForm();
                        }
                      }}
                      className="hover:scale-105 transition-transform"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="gap-2 hover:scale-105 transition-transform"
                    >
                      {isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          {isEditMode ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4" />
                          {isEditMode ? "Update" : "Create"}
                        </>
                      )}
                    </Button>
                  </>
                )}
                {showingBiasAnalysis && (
                  <Button
                    type="button"
                    onClick={handleSaveChanges}
                    className="gap-2 hover:scale-105 transition-transform"
                    disabled={!hasRecommendationSelected}
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                )}
              </div>
              {isCreated && !showingBiasAnalysis && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  {!showApprovalButtons && !noBiasFound && (
                    <>
                      <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium mb-4">
                        Would you like to run a bias analysis on your job description?
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          type="button"
                          className="gap-2 hover:scale-105 transition-transform"
                          onClick={handleBiasAnalysis}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              Run Bias Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  {(showApprovalButtons || noBiasFound) && (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium mb-4">
                        {noBiasFound 
                          ? "No significant bias detected. Would you like to proceed with approval?"
                          : "Your changes have been saved. Would you like to proceed with approval or make additional changes?"}
                      </p>
                      <div className="flex justify-center gap-3">
                        {!noBiasFound && (
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 hover:scale-105 transition-transform"
                            onClick={() => {
                              setShowingBiasAnalysis(true);
                              setShowApprovalButtons(false);
                            }}
                          >
                            <Undo2 className="h-4 w-4" />
                            Make Changes
                          </Button>
                        )}
                        <Button
                          type="button"
                          className="gap-2 hover:scale-105 transition-transform"
                          onClick={() => setShowApprovalConfirm(true)}
                        >
                          <SendHorizontal className="h-4 w-4" />
                          Send for Approval
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          
            {/* Section to display the created job ID */}
            {((isEditMode && jobId) || (!isEditMode && createdJobId)) && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-medium">
                  {isEditMode ? "Updating" : "Created"} Job Description ID:{" "}
                  <span className="font-bold">{isEditMode ? jobId : createdJobId}</span>
                </p>
              </div>
            )}
          </form> 

          {/* Section to display the bias analysis results */}
          {showingBiasAnalysis && Object.entries(biasAnalysis).length > 0 && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <h3 className="font-medium">AI Recommendations</h3>
              {Object.entries(biasAnalysis).map(([field, options]) => (
                <div key={field} className="space-y-2 border-t pt-4 first:border-t-0 first:pt-0">
                  <p className="font-medium">{field}</p>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <RadioGroup
                        value={options.selected || ''}
                        onValueChange={(value) => 
                          handleBiasOptionSelect(field, value as "original" | "alternative" | null)
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="original" id={`${field}-original`} />
                          <Label htmlFor={`${field}-original`}>Original: {options.original}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="alternative" id={`${field}-alternative`} />
                          <Label htmlFor={`${field}-alternative`}>AI Suggestion: {options.alternative}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showApprovalConfirm} onOpenChange={setShowApprovalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Job Description</AlertDialogTitle>
            <AlertDialogDescription>
              This will save your changes and set the job description status to "Pending for Approval". 
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprovalConfirmed}>
              Save & Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add the Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Job Description?</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode ? (
                "You have made changes to this job description. If you exit now, your changes will not be saved."
              ) : (
                "You've started creating a job description. If you exit now, all your work will be lost."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedChangesDialog(false)}>
              Continue {isEditMode ? "Editing" : "Creating"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedChangesDialog(false);
                handleCloseForm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAutoCompleting && (
        <div className="fixed top-0 right-0 m-4 bg-background border rounded-md p-2 shadow-md z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">Auto-completing fields...</p>
          </div>
        </div>
      )}
    </>
  );
}
