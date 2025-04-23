import { Search, RotateCcw, FileEdit } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
import CreateJobDescriptionForm from "./CreateJobDescriptionForm";
import { SearchUpdateJobDescriptionFormProps } from "@/features/job-management/types/searchUpdateJobDescription";
import { useSearchUpdateJobDescription } from "@/features/job-management/hooks/useSearchUpdateJobDescription";

export default function SearchUpdateJobDescriptionForm({
  isOpen,
  onClose,
  onJobSelect,
}: SearchUpdateJobDescriptionFormProps) {
  
  const {
    updateSearchFilters,
    setUpdateSearchFilters,
    updateSearchResults,
    selectedUpdateJob,
    showEditForm,
    selectedJobData,
    
    handleUpdateSearch,
    resetUpdateSearch,
    handleUpdateJobSelect,
    isJobSelected,
    handleUpdateSelectedJob,
    closeEditForm,
    handleUpdateSuccess
  } = useSearchUpdateJobDescription(onClose);

  ///////////////////////////////////////////// UI components /////////////////////
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          resetUpdateSearch();
        }
      }}
      modal={true}
    >
      <DialogContent 
        className="sm:max-w-[725px] max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Update Job Description</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Search for published job descriptions to update. Only jobs with "Published" status can be updated.
          </DialogDescription>
        </DialogHeader>

        {/* Search Form */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-4">Search Filters</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="search-jobTitle">Job Title</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-jobTitle"
                  className="pl-8"
                  value={updateSearchFilters.jobTitle}
                  onChange={(e) =>
                    setUpdateSearchFilters((prev) => ({
                      ...prev,
                      jobTitle: e.target.value,
                    }))
                  }
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="search-department">Department</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-department"
                  className="pl-8"
                  value={updateSearchFilters.department}
                  onChange={(e) =>
                    setUpdateSearchFilters((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  placeholder="e.g. Engineering"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="search-location">Location</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-location"
                  className="pl-8"
                  value={updateSearchFilters.location}
                  onChange={(e) =>
                    setUpdateSearchFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="e.g. Toronto"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="search-jobType">Job Type</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-jobType"
                  className="pl-8"
                  value={updateSearchFilters.jobType}
                  onChange={(e) =>
                    setUpdateSearchFilters((prev) => ({
                      ...prev,
                      jobType: e.target.value,
                    }))
                  }
                  placeholder="e.g. Full-time"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetUpdateSearch}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdateSearch}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {updateSearchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Search Results</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {updateSearchResults.map((result) => (
                <Card
                  key={result.id}
                  className={cn(
                    "hover:bg-muted/50 cursor-pointer transition-colors",
                    isJobSelected(result.id) && "border-primary bg-muted/50"
                  )}
                  onClick={() => handleUpdateJobSelect(result)}
                >
                  <CardContent className="p-4">
                    <div className="grid gap-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{result.jobTitle}</div>
                        <div className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Published
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{result.department}</span>
                          <span>•</span>
                          <span>{result.location}</span>
                          <span>•</span>
                          <span>{result.jobType}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      {showEditForm && selectedJobData && (
        <Dialog open={showEditForm} onOpenChange={(open) => !open && closeEditForm()}>
          <DialogContent className="sm:max-w-[725px] max-h-[80vh] overflow-y-auto">
            <CreateJobDescriptionForm
              isOpen={showEditForm}
              onClose={closeEditForm}
              isEditMode={true}
              initialData={selectedJobData}
              jobId={selectedJobData.id}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </DialogContent>
        </Dialog>
      )}

        {/* No Results Message */}
        {updateSearchResults.length === 0 && 
          Object.values(updateSearchFilters).some(value => value !== "") && (
          <div className="text-center py-6 text-muted-foreground">
            No job descriptions found matching your search criteria.
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="hover:scale-105 transition-transform"
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={!selectedUpdateJob}
            onClick={handleUpdateSelectedJob}
            className="gap-2 hover:scale-105 transition-transform"
          >
            <FileEdit className="h-4 w-4" />
            Update Selected Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}