import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Home, Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { useScreenSize } from "@/shared/hooks/use-screen-size";
import { useAuth } from "@/features/auth/hooks/use-auth";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const { isMobile } = useScreenSize();
  const { user, logoutMutation } = useAuth();

  const NavContent = () => (
    <div className={isMobile ? "flex flex-col gap-4" : "flex items-center justify-between w-full"}>
      <div className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
              {item.label}
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
            </a>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm font-medium">
              Welcome, <span className="text-primary">{user.username}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                "Logging out..."
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </>
        ) : (
          <Link href="/auth">
            <Button variant="default">Sign In</Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <span className="font-bold text-xl">Modern App</span>
        </Link>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <NavContent />
        )}
      </div>
    </header>
  );
}