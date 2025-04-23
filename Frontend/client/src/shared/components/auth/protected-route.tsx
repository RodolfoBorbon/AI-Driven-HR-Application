import { FC, ComponentType, useEffect, ReactElement } from "react";
import { useLocation, Route } from "wouter";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { USER_ROLES } from "@/features/auth/api/authService";

interface ProtectedRouteProps {
  component: ComponentType<any>;
  requiredRoles?: string[];
  requiredPermission?: string;
  path: string;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  component: Component,
  requiredRoles = [],
  requiredPermission,
  path,
  ...rest
}) => {
  const { user, hasPermission } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if specific roles are required
    if (requiredRoles.length > 0 && user.role && !requiredRoles.includes(user.role)) {
      navigate("/");
      return;
    }
    
    // Check if specific permission is required
    if (requiredPermission && !hasPermission(requiredPermission)) {
      navigate("/");
      return;
    }
  }, [user, requiredRoles, requiredPermission, navigate, hasPermission]);

  // Return the Route component with the path and component
  return (
    <Route path={path} component={Component} />
  );
};