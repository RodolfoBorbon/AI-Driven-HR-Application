import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLocation } from "wouter";
import { USER_ROLES } from "@/features/auth/api/authService";
import { 
  userFormSchema, 
  deleteConfirmationSchema,
  UserFormValues,
  DeleteConfirmationValues,
  UserData
} from "@/features/user-management/types/userManagementInterfaces";
import { getAllUsers, createUser, deleteUser } from "@/features/user-management/api/userManagementAPIs";

export function useUserManagement() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form change tracking and confirmation dialog
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  
  // Check if user has permission to access this page
  const canAccessUserManagement = user?.role === USER_ROLES.IT_ADMIN;
  
  // Fetch users query
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    enabled: canAccessUserManagement, 
  });
  
  // Create user form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: USER_ROLES.HR_ASSISTANT,
    },
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user has been created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    },
  });
  
  // Delete user states and form
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  
  const deleteForm = useForm<DeleteConfirmationValues>({
    resolver: zodResolver(deleteConfirmationSchema),
    defaultValues: {
      confirmation: ''
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      console.log("Attempting to delete user with ID:", userId, typeof userId);
      return deleteUser(userId);
    },
    onSuccess: () => {
      const username = userToDelete?.username || "User";
      
      console.log("User deletion successful:", username);
      toast({
        title: "User Deleted",
        description: `${username} has been deleted successfully.`,
        duration: 3000,
      });
      
      setIsDeleteDialogOpen(false);
      deleteForm.reset();
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("User deletion failed:", error);
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // Form change detection effect
  useEffect(() => {
    const subscription = form.watch(() => {
      const formValues = form.getValues();
      const hasChanges = 
        formValues.username !== "" || 
        formValues.email !== "" || 
        formValues.password !== "";
      
      setHasFormChanges(hasChanges);
    });
    
    return () => subscription.unsubscribe();
  }, [form, form.watch]);
  
  // Permission check effect
  useEffect(() => {
    if (user && !canAccessUserManagement) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access User Management",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, canAccessUserManagement, navigate, toast]);
  
  // Form submission handlers
  const onSubmit = (values: UserFormValues) => {
    createUserMutation.mutate(values);
  };
  
  const onDeleteSubmit = (values: DeleteConfirmationValues) => {
    if (!userToDelete) {
      console.error("No user selected for deletion");
      return;
    }
    
    if (values.confirmation.toLowerCase() === 'delete') {
      const userId = String(userToDelete.id).trim();
      deleteUserMutation.mutate(userId);
    } else {
      toast({
        title: "Invalid Confirmation",
        description: "Please type 'delete' to confirm user deletion",
        variant: "destructive",
      });
    }
  };
  
  // Dialog handlers
  const handleDialogCloseAttempt = () => {
    if (hasFormChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      setIsCreateDialogOpen(false);
      form.reset();
    }
  };
  
  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  const handleDeleteClick = (user: UserData) => {
    if (user.role === USER_ROLES.IT_ADMIN) {
      toast({
        title: "Cannot Delete IT Admin",
        description: "IT Admin users cannot be deleted for security reasons",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
    deleteForm.reset();
  };
  
  return {
    // State
    user,
    users,
    isLoading,
    error,
    canAccessUserManagement,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    userToDelete,
    setUserToDelete,
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    
    // Forms
    form,
    deleteForm,
    
    // Mutations
    createUserMutation,
    deleteUserMutation,
    
    // Handlers
    onSubmit,
    onDeleteSubmit,
    handleDialogCloseAttempt,
    handleDiscardChanges,
    handleDeleteClick,
  };
}