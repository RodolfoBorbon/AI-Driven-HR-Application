import { useState, useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { searchJobsListInProcess } from "@/features/job-management/api/jobDescriptionAPIs";
import { 
  UpdateJobListStatusFilters,
  PaginationInfo
} from "@/features/job-management/types/createJobDescriptionInterfaces";
import {
  JobDescriptionListItem,
  SortField,
  SortDirection, 
  ListSearchFilters
} from "@/features/job-management/types/inProcessJobDescriptionInterfaces";

export function useInProcessJobDescription() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();

  // States
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [jobsList, setJobsList] = useState<JobDescriptionListItem[]>([]);
  const [listSearchFilters, setListSearchFilters] = useState<ListSearchFilters>({
    jobTitle: "",
    department: "",
    location: "",
    status: "",
  });
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: "jobTitle",
    direction: "asc",
  });

  // Access control - check if user can approve jobs
  const canApproveJobs = hasPermission("canApproveJobs");
  
  // Add specific permission check for formatting
  const canFormatJobs = user?.role === "HR Assistant" || user?.role === "IT Admin";

  const handleSearch = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const filters: UpdateJobListStatusFilters = {
        jobTitle: listSearchFilters.jobTitle || undefined,
        department: listSearchFilters.department || undefined,
        location: listSearchFilters.location || undefined,
        status: listSearchFilters.status || undefined,
        page,
        limit: 10
      };
  
      const response = await searchJobsListInProcess(filters);
  
      if (response.success && response.data) {
        setJobsList(response.data);
        setPaginationInfo(response.pagination || null);
        setCurrentPage(page);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch jobs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [listSearchFilters, toast]);

  // Load initial data
  useEffect(() => {
    handleSearch(1);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: 
        prevConfig.field === field && prevConfig.direction === "asc" 
          ? "desc" 
          : "asc"
    }));
  }, []);

  const handleReset = useCallback(async () => {
    // Reset all filters
    setListSearchFilters({
      jobTitle: "",
      department: "",
      location: "",
      status: "",
    });
    
    // Reset page to 1
    setCurrentPage(1);
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Call API with empty filters to get all jobs
      const response = await searchJobsListInProcess({
        page: 1,
        limit: 10
      });
  
      if (response.success && response.data) {
        setJobsList(response.data);
        setPaginationInfo(response.pagination || null);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to reset job list",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset job list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sortedAndFilteredJobs = useMemo(() => {
    const sortedJobs = [...jobsList].sort((a, b) => {
      const { field, direction } = sortConfig;
      const aValue = a[field].toLowerCase();
      const bValue = b[field].toLowerCase();
  
      if (aValue < bValue) {
        return direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  
    return sortedJobs;
  }, [jobsList, sortConfig]);

  const getActionButton = (job: JobDescriptionListItem) => {
    switch (job.status) {
      case "Pending for Approval":
        // Only show the Approve button if user has permission
        return canApproveJobs ? {
          label: "Approve",
          action: () => handleApprove(job.id),
          className: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
        } : null;
      case "Approved":
        // Only show Format button if user has formatting permission
        return canFormatJobs ? {
          label: "Format",
          action: () => handleFormat(job.id),
          className: "bg-blue-100 hover:bg-blue-200 text-blue-800"
        } : null;
      case "Formatted":
        return {
          label: "Publish",
          action: () => handlePublish(job.id),
          className: "bg-green-100 hover:bg-green-200 text-green-800"
        };
      default:
        return null;
    }
  };

  // Handler for Job approval
  const handleApprove = (jobId: string) => {
    if (!canApproveJobs) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to approve job descriptions",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedJobId(jobId);
    setIsApproveDialogOpen(true);
  };
  
  const handleFormat = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsFormatDialogOpen(true);
  };
  
  const handlePublish = (jobId: string) => {
    console.log("Publish job:", jobId);
    // TODO: Implement publish functionality
  };

  return {
    // State
    isLoading,
    currentPage,
    paginationInfo,
    jobsList: sortedAndFilteredJobs,
    listSearchFilters,
    sortConfig,
    isApproveDialogOpen,
    isFormatDialogOpen,
    selectedJobId,
    showApproveConfirm,
    
    // Permissions
    canApproveJobs,
    canFormatJobs,
    
    // Setters
    setListSearchFilters,
    setIsApproveDialogOpen,
    setIsFormatDialogOpen,
    setSelectedJobId,
    
    // Handlers
    handleSearch,
    handleSort,
    handleReset,
    handleApprove,
    handleFormat,
    handlePublish,
    getActionButton,
  };
}