import { Button } from "@/shared/components/ui/button";
import { FilePlus, FileEdit, Plus, X, Save, SendHorizontal, Undo2, CheckCircle2, Brain, AlertTriangle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { UpdateSearchResponse, UpdateJobFilters, UpdateJobResult,  ActiveFields, CustomField, BiasAnalysisOption, JobSearchFilters, 
  JobSearchResult, JobDescriptionListItem, SortField, SortDirection, JobDetails} from '@/features/job-management/types/createJobDescriptionInterfaces';
import CreateJobDescriptionForm from "@/features/job-management/components/CreateJobDescriptionForm";
import SearchUpdateJobDescriptionForm  from "@/features/job-management/components/SearchUpdateJobDescriptionForm";
import JobDescriptionsInProcessListings from "@/features/job-management/components/JobDescriptionsInProcessListings";


export default function Hiring() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobSearchResult | null>(null);
  const [isPending, setIsPending] = useState(false);
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
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isCreated, setIsCreated] = useState(false);
  const [biasAnalysis, setBiasAnalysis] = useState<Record<string, BiasAnalysisOption>>({});
  const [showingBiasAnalysis, setShowingBiasAnalysis] = useState(false);
  // const [submittedData, setSubmittedData] = useState<JobFormData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSelectedRecommendations, setHasSelectedRecommendations] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [hasRecommendationSelected, setHasRecommendationSelected] = useState(false);
  const [searchFilters, setSearchFilters] = useState<JobSearchFilters>({
    jobTitle: "",
    department: "",
    location: "",
    jobType: "",
  });
  const [searchResults, setSearchResults] = useState<JobSearchResult[]>([]);
  const [listSearchFilters, setListSearchFilters] = useState({
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

  // const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobDetails | null>(null);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [editFormData, setEditFormData] = useState<JobDetails | null>(null);
  // const [selectedJobId, setSelectedJobId] = useState("");
  const [justSaved, setJustSaved] = useState(false); // Add new state
  const [createdJobId, setCreatedJobId] = useState<string | null>(null); // New state for created job ID

  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false); // New state for unsaved changes dialog

  const [showApprovalButtons, setShowApprovalButtons] = useState(false);
  const [noBiasFound, setNoBiasFound] = useState(false);

  const [isEditDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Add this function before the return statement
  const handleEditJob = (jobId: string) => {
    setSelectedJobId(jobId);
    // Don't close the update dialog automatically
    toast({
      title: "Edit Job",
      description: `Opening job ${jobId} for editing`,
    });
  };

  return (
    <div className="p-0">
      {/* Black header container that spans full width and touches the top */}
      <div className="bg-black text-white w-full py-8 mb-6">
        <div className="px-6">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Hiring
          </h1>
          <p className="mt-1 text-gray-300">
            Create and manage job descriptions efficiently
          </p>
        </div>
      </div>
      
      {/* Content area with padding */}
      <div className="px-6">
        {/* Buttons positioned below the black container, aligned to the right */}
        <div className="flex justify-end gap-4 mb-8">
          <Button 
            className="gap-2 hover:scale-105 transition-transform" 
            onClick={() => {
              setIsCreateOpen(true);
              setIsCreated(false);
            }}
          >
            <FilePlus className="h-4 w-4" />
            Create Job Description
          </Button>
          <Button 
            className="gap-2 hover:scale-105 transition-transform" 
            onClick={() => setIsUpdateOpen(true)}
          >
            <FileEdit className="h-4 w-4" />
            Update Job Description
          </Button>
        </div>
    
        {/* Create Job Description Form */}
        <CreateJobDescriptionForm 
          isOpen={isCreateOpen} 
          onClose={() => {
            setIsCreateOpen(false);
            setIsCreated(false);
          }} 
        />
    
        {/* Search and Update Job Description Form */}
        <SearchUpdateJobDescriptionForm 
          isOpen={isUpdateOpen}
          onClose={() => {
            setIsUpdateOpen(false);
            setSelectedJobId(null); // Reset selected job when closing
          }}
          onJobSelect={handleEditJob}
        />
    
        {/* Job listings table */}
        <JobDescriptionsInProcessListings />
      </div>
    </div>
  );
}