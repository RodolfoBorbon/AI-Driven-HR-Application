import { useLocation } from "wouter";
import { cn } from "@/shared/utils/utils";
import { Home, Users, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { type FC, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { USER_ROLES } from "@/features/auth/api/authService";

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
  visible: (user: any) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { 
    label: "Home", 
    href: "/", 
    icon: <Home className="h-4 w-4" />,
    visible: () => true // Everyone can see home
  },
  { 
    label: "Hiring", 
    href: "/hiring", 
    icon: <Users className="h-4 w-4" />,
    visible: () => true // Everyone can see hiring
  },
  { 
    label: "User Management", 
    href: "/user-management", 
    icon: <Users className="h-4 w-4" />,
    visible: (user) => user?.role === USER_ROLES.IT_ADMIN // Only IT Admin
  }
];

export const Sidebar: FC = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Add logging to help debug
  useEffect(() => {
    console.log("Sidebar rendering with user:", user);
  }, [user]);

  // Add a handler for logout
  const handleLogout = () => {
    logoutMutation.mutate();
    // No need to navigate here as it's now handled in the useLogoutMutation
  };

  return (
    <div className="w-64 min-h-screen bg-sidebar border-r flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-sidebar-foreground">EXERA Solutions</h1>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {NAV_ITEMS.filter(item => item.visible(user)).map((item) => {
          const isActive = location === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 mb-1",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Button>
            </a>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t bg-primary/5">
        {user ? (
          <div className="space-y-3">
            <div className="px-3 py-2 rounded-lg bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <p className="text-sm text-muted-foreground">
                Logged in as
              </p>
              <p className="font-medium text">
                {user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                Role: {user.role || "User"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Sign Out"}
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <p>Not logged in</p>
          </div>
        )}
      </div>
    </div>
  );
};