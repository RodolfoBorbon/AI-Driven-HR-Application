// Interface for job approval form props
export interface ApproveJobDescriptionFormProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    onApproveSuccess: () => void;
  }