export interface JobDescriptionListItem {
    id: string;
    jobTitle: string;
    department: string;
    location: string;
    status: string;
  }
  
  export type SortField = "jobTitle" | "department" | "location" | "status";
  export type SortDirection = "asc" | "desc";
  
  export interface ListSearchFilters {
    jobTitle: string;
    department: string;
    location: string;
    status: string;
  }