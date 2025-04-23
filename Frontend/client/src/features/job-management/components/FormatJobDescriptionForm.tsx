import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Building2, Check, GlobeIcon } from "lucide-react";
import { useFormatJobDescription } from "@/features/job-management/hooks/useFormatJobDescription";
import { FormatJobDescriptionFormProps } from "@/features/job-management/types/formatJobDescriptionInterfaces";
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import "@/features/job-management/styles/formatJobDescription.css";

export function FormatJobDescriptionForm({
  isOpen,
  onClose,
  jobId,
  onFormatSuccess,
}: FormatJobDescriptionFormProps) {
  // Use our custom hook
  const {
    isLoading,
    formattedPreview,
    showConfirmDialog,
    showFinalConfirmDialog,
    selectedPlatforms,
    publishingJob,
    handlePublishClick,
    handleProceedToFinalConfirm,
    handleConfirmPublish,
    handleCancelPublish,
    handleCancelFinalConfirm,
    handlePlatformToggle,
    getSelectedPlatformsText
  } = useFormatJobDescription({
    jobId,
    isOpen,
    onClose,
    onFormatSuccess
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center">
          <DialogTitle className="text-3xl font-semibold text-center">Job Description Preview</DialogTitle>
          <DialogDescription className="text-center mt-2">
            Review how your job description will appear when published.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden bg-white">
                <div dangerouslySetInnerHTML={{ __html: formattedPreview }} />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublishClick}
                  disabled={publishingJob}
                >
                  {publishingJob ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
      
      {/* First AlertDialog for platform selection */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog => handleCancelPublish()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Select Publishing Platforms</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Choose which platforms you want to publish this job to:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 flex flex-col gap-3">
            <div className="flex items-center space-x-4 h-16 p-4 rounded-md border hover:bg-gray-50">
              <Checkbox 
                id="indeed-checkbox"
                checked={selectedPlatforms.indeed}
                onCheckedChange={() => handlePlatformToggle('indeed')}
                className="h-5 w-5"
              />
              <div className="flex items-center space-x-4 flex-1">
                <Building2 className="h-8 w-8 text-blue-600" />
                <label 
                  htmlFor="indeed-checkbox"
                  className="font-medium cursor-pointer flex-1"
                >
                  Indeed
                </label>
              </div>
              {selectedPlatforms.indeed && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </div>
            
            <div className="flex items-center space-x-4 h-16 p-4 rounded-md border hover:bg-gray-50">
              <Checkbox 
                id="linkedin-checkbox"
                checked={selectedPlatforms.linkedin}
                onCheckedChange={() => handlePlatformToggle('linkedin')}
                className="h-5 w-5"
              />
              <div className="flex items-center space-x-4 flex-1">
                <GlobeIcon className="h-8 w-8 text-red-600" />
                <label 
                  htmlFor="linkedin-checkbox"
                  className="font-medium cursor-pointer flex-1"
                >
                  LinkedIn
                </label>
              </div>
              {selectedPlatforms.linkedin && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPublish}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleProceedToFinalConfirm}
              disabled={!selectedPlatforms.indeed && !selectedPlatforms.linkedin}
              className={`${!selectedPlatforms.indeed && !selectedPlatforms.linkedin ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Second AlertDialog for final confirmation */}
      <AlertDialog open={showFinalConfirmDialog} onOpenChange={setShowFinalConfirmDialog => handleCancelFinalConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Confirm Publishing</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to publish this job to {getSelectedPlatformsText()}?
              <br /><br />
              This action will change the job status to "Published".
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelFinalConfirm}>Go Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmPublish}
              disabled={publishingJob}
              className={publishingJob ? "opacity-70 cursor-not-allowed" : ""}
            >
              {publishingJob ? "Publishing..." : "Publish Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}