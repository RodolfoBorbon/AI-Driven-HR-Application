import { Link, useLocation } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  Users, 
  ChevronDown,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { USER_ROLES } from "@/features/auth/api/authService";

export default function Navigation() {
  const [location] = useLocation();
  const { user, hasPermission, logoutMutation } = useAuth();
  
  // Early return if user is not authenticated
  if (!user) return null;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Show User Management only for IT Admin specifically
  const isITAdmin = user.role === USER_ROLES.IT_ADMIN;
  
  // Define navigation items with role-based visibility
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5 mr-2" />,
      active: location === "/",
      visible: true, // Everyone can see the dashboard
    },
    {
      name: "Hiring",
      href: "/hiring",
      icon: <FileText className="w-5 h-5 mr-2" />,
      active: location === "/hiring",
      visible: true, // Everyone can see hiring
    },
    {
      name: "User Management",
      href: "/user-management",
      icon: <Users className="w-5 h-5 mr-2" />,
      active: location === "/user-management",
      visible: isITAdmin, // Only IT Admin can see this
    }
  ];

  return (
    <nav className="bg-white border-b px-4 py-2.5 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <Link href="/">
          <a className="text-xl font-bold text-primary">EXERA</a>
        </Link>
        
        <div className="hidden md:flex space-x-1">
          {navigationItems
            .filter(item => item.visible)
            .map((item) => (
              <Button
                key={item.href}
                variant={item.active ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href}>
                  <a className="flex items-center">
                    {item.icon}
                    {item.name}
                  </a>
                </Link>
              </Button>
            ))}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.username ? user.username.substring(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">{user.username}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <a className="w-full cursor-pointer">Profile</a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <a className="w-full cursor-pointer">Settings</a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
