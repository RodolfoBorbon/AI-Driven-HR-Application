import { ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  /**
   * The children to render if the user has the required permission
   */
  children: ReactNode;

  /**
   * The permission required to access the protected content
   */
  requiredPermission: string;

  /**
   * Custom message to display when access is denied
   */
  message?: string;

  /**
   * Content to show when access is denied (overrides default alert)
   */
  fallback?: ReactNode;

  /**
   * If true, will render nothing instead of an access denied message
   */
  hideIfDenied?: boolean;
}

/**
 * A component that conditionally renders its children based on user permissions
 */
export default function RoleGuard({
  children,
  requiredPermission,
  message,
  fallback,
  hideIfDenied = false,
}: RoleGuardProps) {
  const { hasPermission, user } = useAuth();
  
  // Check if user has the required permission
  const hasAccess = hasPermission(requiredPermission);
  
  // If user has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // If hideIfDenied is true, render nothing
  if (hideIfDenied) {
    return null;
  }
  
  // If a custom fallback is provided, render that
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Otherwise, render the default access denied message
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        {message || `Your current role (${user?.role}) doesn't have permission to access this feature.`}
      </AlertDescription>
    </Alert>
  );
}
