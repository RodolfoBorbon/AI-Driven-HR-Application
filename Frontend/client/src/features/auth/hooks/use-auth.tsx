import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/queryClient";
import { useToast } from "@/shared/hooks/use-toast";
import authService from "@/features/auth/api/authService";
import type { User } from "@/features/auth/api/authService";
import { USER_ROLES } from "@/features/auth/api/authService"; // Add this import
import { useLocation } from "wouter"; 
import { hasPermission } from "@/features/auth/api/authService";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  hasPermission: (permission: string) => boolean;
};

function useLoginMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      console.log("Login mutation triggered with:", credentials.email);
      return await authService.login(credentials);
    },
    onSuccess: (user) => {
      console.log("Login mutation success:", user);
      
      // Immediately update the user in the React Query cache
      queryClient.setQueryData(["user"], user);
      
      // Also invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["user"] });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      
      // Display the user-friendly error message from the authService
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Keep this function, but update its description to reflect that it's used for admin-initiated registration
function useRegisterMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userData: any) => {
      // This is now only called from the User Management interface
      return await authService.register(userData);
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("User creation error details:", error);
      
      let errorMessage = "Unable to create user";
      
      if (error.message.includes("email") || error.message.includes("already registered")) {
        errorMessage = error.message;
      }
      
      toast({
        title: "User creation failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

function useLogoutMutation() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  return useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      toast({
        title: "Goodbye!",
        description: "You have been logged out successfully.",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
  });
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: () => authService.getCurrentUser(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  // Helper function to check if user has a specific permission
  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Direct role check for important permissions
    if (permission === "canManageUsers" && user.role === USER_ROLES.IT_ADMIN) {
      return true;
    }
    
    // Fix the type error by handling the case where role could be undefined
    return hasPermission(user.role || "", permission as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        hasPermission: checkPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}