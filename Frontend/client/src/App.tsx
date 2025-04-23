import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/lib/queryClient";
import { Toaster } from "@/shared/components/ui/toaster";
import NotFound from "@/pages/not-found/not-found";
import Home from "@/pages/home/home";
import Hiring from "@/pages/hiring/hiring";
import AuthPage from "@/pages/auth/auth-page";
import UserManagementPage from "@/pages/user-management/user-management";
import { Container } from "@/shared/components/layout/Container";
import { Sidebar } from "@/shared/components/layout/Sidebar";
import { AuthProvider } from "./features/auth/hooks/use-auth";
import { ProtectedRoute } from "@/shared/components/auth/protected-route";
import { USER_ROLES } from "@/features/auth/api/authService";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute
        path="/"
        component={() => (
          <Container>
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Home />
            </main>
          </Container>
        )}
      />
      <ProtectedRoute
        path="/hiring"
        component={() => (
          <Container>
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Hiring />
            </main>
          </Container>
        )}
      />
      <ProtectedRoute 
        path="/user-management" 
        component={UserManagementPage} 
        requiredRoles={[USER_ROLES.IT_ADMIN]} 
        requiredPermission="canManageUsers"
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;