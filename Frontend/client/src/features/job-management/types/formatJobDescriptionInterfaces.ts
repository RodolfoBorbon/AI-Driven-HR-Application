// Interfaces for the FormatJobDescription 

export type Platform = "indeed" | "linkedin";

export interface FormatJobDescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onFormatSuccess?: () => void;
}

export interface PublishJobParams {
  jobId: string;
  platform: Platform;
  formattedContent: string;
}

export interface PublishJobResult {
  success: boolean;
  error?: string;
}

export interface UseFormatJobDescriptionProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onFormatSuccess?: () => void;
}