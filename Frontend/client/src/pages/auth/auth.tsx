import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { UserCredentials } from "@/features/auth/api/authService";
import { USER_ROLES } from "@/features/auth/api/authService";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { InfoIcon, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

// Login schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { loginMutation } = useAuth(); // Remove registerMutation
  const [showRolesInfo, setShowRolesInfo] = useState(false);
  
  // Login form
  const loginForm = useForm<UserCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: UserCredentials) => {
    try {
      await loginMutation.mutateAsync(values);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // For showing admin login info
  const adminLoginInfo = {
    email: "admin@exera.com",
    password: "admin123456",
    role: USER_ROLES.IT_ADMIN
  };

  return (
    <div className="container grid h-screen place-items-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">EXERA</h1>
          <p className="text-muted-foreground">Job Description Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Default Admin Account</AlertTitle>
              <AlertDescription>
                Email: admin@exera.com<br/>
                Password: admin123456
              </AlertDescription>
            </Alert>
            
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          {...field}
                          autoComplete="email"
                          className="focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          autoComplete="current-password"
                          className="focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>User Registration</AlertTitle>
                  <AlertDescription>
                    New accounts can only be created by IT Administrators.
                  </AlertDescription>
                </Alert>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Dialog open={showRolesInfo} onOpenChange={setShowRolesInfo}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm gap-1">
                  Learn about user roles <InfoIcon className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Role-Based Access Control</DialogTitle>
                  <DialogDescription>
                    Different roles have different permissions in the system.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  <Table>
                    <TableCaption>Access permissions by role</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Role</TableHead>
                        <TableHead>Access Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">IT Admin</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-purple-500" />
                            <span>Full access to all features and user management</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">HR Manager</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                            <span>Can view metrics and approve job descriptions</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">HR Assistant</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                            <span>Can create and format job descriptions</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setShowRolesInfo(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
