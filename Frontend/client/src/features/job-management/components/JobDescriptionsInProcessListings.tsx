import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import cn from 'classnames';
import { ApproveJobDescriptionForm } from "@/features/job-management/components/ApproveJobDescriptionForm";
import { FormatJobDescriptionForm } from "@/features/job-management/components/FormatJobDescriptionForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useInProcessJobDescription } from "@/features/job-management/hooks/useInProcessJobDescription";

export default function JobDescriptionsInProcessListings() {
  const {
    isLoading,
    currentPage,
    paginationInfo,
    jobsList,
    listSearchFilters,
    sortConfig,
    isApproveDialogOpen,
    isFormatDialogOpen,
    selectedJobId,
    canApproveJobs,
    canFormatJobs,
    setListSearchFilters,
    setIsApproveDialogOpen,
    setIsFormatDialogOpen,
    setSelectedJobId,
    handleSearch,
    handleSort,
    handleReset,
    getActionButton,
  } = useInProcessJobDescription();

  return (
    <div className="mt-8 border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Job Descriptions In Process</h2>
  
      {/* Search Interface section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Input
              placeholder="Search job title..."
              className="pl-8"
              value={listSearchFilters.jobTitle}
              onChange={(e) => setListSearchFilters(prev => ({
                ...prev,
                jobTitle: e.target.value
              }))}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              placeholder="Search department..."
              className="pl-8"
              value={listSearchFilters.department}
              onChange={(e) => setListSearchFilters(prev => ({
                ...prev,
                department: e.target.value
              }))}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              placeholder="Search location..."
              className="pl-8"
              value={listSearchFilters.location}
              onChange={(e) => setListSearchFilters(prev => ({
                ...prev,
                location: e.target.value
              }))}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Input
              placeholder="Search status..."
              className="pl-8"
              value={listSearchFilters.status}
              onChange={(e) => setListSearchFilters(prev => ({
                ...prev,
                status: e.target.value
              }))}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="w-24"
          >
            Reset
          </Button>
          <Button 
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="w-24"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSearch(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSearch(currentPage + 1)}
            disabled={!paginationInfo?.hasMore || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                className="flex items-center gap-1"
                onClick={() => handleSort("jobTitle")}
              >
                Job Title
                <ArrowUpDown className={cn("h-4 w-4", {
                  "text-muted-foreground": sortConfig.field !== "jobTitle",
                  "text-foreground": sortConfig.field === "jobTitle"
                })} />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="flex items-center gap-1"
                onClick={() => handleSort("department")}
              >
                Department
                <ArrowUpDown className={cn("h-4 w-4", {
                  "text-muted-foreground": sortConfig.field !== "department",
                  "text-foreground": sortConfig.field === "department"
                })} />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="flex items-center gap-1"
                onClick={() => handleSort("location")}
              >
                Location
                <ArrowUpDown className={cn("h-4 w-4", {
                  "text-muted-foreground": sortConfig.field !== "location",
                  "text-foreground": sortConfig.field === "location"
                })} />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="flex items-center gap-1"
                onClick={() => handleSort("status")}
              >
                Status
                <ArrowUpDown className={cn("h-4 w-4", {
                  "text-muted-foreground": sortConfig.field !== "status",
                  "text-foreground": sortConfig.field === "status"
                })} />
              </Button>
            </TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobsList.map((job) => {
            const actionButton = getActionButton(job);
            
            return (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.jobTitle}</TableCell>
                <TableCell>{job.department}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    {
                      "bg-yellow-100 text-yellow-800": job.status === "Pending for Approval",
                      "bg-blue-100 text-blue-800": job.status === "Formatted",
                      "bg-green-100 text-green-800": job.status === "Published" || job.status === "Approved",
                      "bg-gray-100 text-gray-800": false
                    }
                  )}>
                    {job.status}
                  </span>
                </TableCell>
                <TableCell>
                  {actionButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={actionButton.action}
                      className={cn("whitespace-nowrap", actionButton.className)}
                      disabled={(job.status === "Pending for Approval" && !canApproveJobs) || 
                               (job.status === "Approved" && !canFormatJobs)}
                    >
                      {actionButton.label}
                      {job.status === "Pending for Approval" && !canApproveJobs && 
                        " (No Permission)"}
                      {job.status === "Approved" && !canFormatJobs && 
                        " (No Permission)"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {paginationInfo && (
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, paginationInfo.total)} of {paginationInfo.total} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSearch(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSearch(currentPage + 1)}
            disabled={!paginationInfo?.hasMore || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    )}
    {isApproveDialogOpen && selectedJobId && canApproveJobs && (
      <ApproveJobDescriptionForm
        isOpen={isApproveDialogOpen}
        onClose={() => {
          setIsApproveDialogOpen(false);
          setSelectedJobId(null);
        }}
        jobId={selectedJobId}
        onApproveSuccess={() => {
          handleSearch(currentPage);
        }}
      />
    )}
      
    {/* Access denied dialog for when a user without permission tries to approve */}
    {isApproveDialogOpen && selectedJobId && !canApproveJobs && (
      <AlertDialog open={true} onOpenChange={() => setIsApproveDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permission Denied</AlertDialogTitle>
            <AlertDialogDescription>
              You don't have permission to approve job descriptions. 
              This action requires HR Manager or IT Admin privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsApproveDialogOpen(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
      
    {isFormatDialogOpen && selectedJobId && (
      <FormatJobDescriptionForm
        isOpen={isFormatDialogOpen}
        onClose={() => {
          setIsFormatDialogOpen(false);
          setSelectedJobId(null);
        }}
        jobId={selectedJobId}
        onFormatSuccess={() => {
          handleSearch(currentPage);
        }}
      />
    )}
    </div>
  );
}