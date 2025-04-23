import React from "react";
import { 
  AlertCircle, 
  UserPlus, 
  Loader2, 
  Trash2,
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Container } from "@/shared/components/layout/Container";
import { Sidebar } from "@/shared/components/layout/Sidebar";
import { USER_ROLES } from "@/features/auth/api/authService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { UserData } from "@/features/user-management/types/userManagementInterfaces";
import { useUserManagement } from "@/features/user-management/hooks/useUserManagement";

export function UserManagement() {
  const {
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
  } = useUserManagement();
  
  if (!user) {
    return null; // Don't render anything while checking authentication
  }
  
  // If user doesn't have permission, show access denied
  if (!canAccessUserManagement) {
    return (
      <Container>
        <Sidebar />
        <main className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the User Management page.
              This feature is only available to IT Administrators.
            </AlertDescription>
          </Alert>
        </main>
      </Container>
    );
  }
  
  return (
    <Container>
      <Sidebar />
      <main className="flex-1 p-0">
        {/* Black header container that spans full width and touches the top */}
        <div className="bg-black text-white w-full py-8 mb-6">
          <div className="px-6">
            <h1 className="text-4xl font-extrabold tracking-tight">
              User Management
            </h1>
            <p className="mt-1 text-gray-300">
              Manage users and their permissions
            </p>
          </div>
        </div>
        
        {/* Content area with padding */}
        <div className="px-6">
          {/* Create User button positioned below the black container, aligned to the right */}
          <div className="flex justify-end mb-6">
            <Dialog 
              open={isCreateDialogOpen} 
              onOpenChange={(open) => {
                // Only handle closing events (when open becomes false)
                if (!open && isCreateDialogOpen) {
                  // Instead of immediately closing, check for unsaved changes
                  handleDialogCloseAttempt();
                  return false; // Prevent default closing behavior
                }
                // For opening the dialog, use the default behavior
                setIsCreateDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="p-0 overflow-hidden max-w-md"
                onInteractOutside={(e) => {
                  e.preventDefault(); // Prevent closing when clicking outside
                }}
                onEscapeKeyDown={(e) => {
                  // Prevent closing with Escape key
                  e.preventDefault();
                  // Instead, show the confirmation dialog if there are changes
                  handleDialogCloseAttempt();
                }}
              >
                {/* Updated header with gradient background and centered icon */}
                <DialogHeader className="text-center pb-4 mb-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 mx-[-24px] mt-[-24px] pt-8 pb-6 border-b">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-primary/10 rounded-full mb-3">
                        <UserPlus className="h-7 w-7 text-primary" />
                      </div>
                      <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                        Create New User
                      </DialogTitle>
                      <div className="h-1 w-16 bg-primary/30 rounded-full mt-3"></div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-5 text-center mx-auto max-w-md">
                    Add a new user to the system with their role and permissions. Required fields are marked with *.
                  </div>
                </DialogHeader>
                
                {/* Form content with padding */}
                <div className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={USER_ROLES.IT_ADMIN}>{USER_ROLES.IT_ADMIN}</SelectItem>
                                <SelectItem value={USER_ROLES.HR_MANAGER}>{USER_ROLES.HR_MANAGER}</SelectItem>
                                <SelectItem value={USER_ROLES.HR_ASSISTANT}>{USER_ROLES.HR_ASSISTANT}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This determines what features the user can access.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="mt-6 pt-4 border-t">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleDialogCloseAttempt}
                          disabled={createUserMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createUserMutation.isPending}
                          className="gap-2"
                        >
                          {createUserMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Create User
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                List of all users in the system and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load users. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableCaption>List of all users in the system</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.data?.map((user: UserData) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${user.role === USER_ROLES.IT_ADMIN 
                              ? 'bg-purple-100 text-purple-800' 
                              : user.role === USER_ROLES.HR_MANAGER
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={user.role === USER_ROLES.IT_ADMIN}
                                >
                                  <Trash2 
                                    className={`h-4 w-4 ${
                                      user.role === USER_ROLES.IT_ADMIN 
                                        ? 'text-gray-400'
                                        : 'text-red-500'
                                    }`} 
                                  />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {user.role === USER_ROLES.IT_ADMIN
                                  ? "IT Admin users cannot be deleted"
                                  : "Delete user"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Delete confirmation dialog */}
          <AlertDialog 
            open={isDeleteDialogOpen} 
            onOpenChange={(open) => {
              setIsDeleteDialogOpen(open);
              if (!open) {
                deleteForm.reset();
                setUserToDelete(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm User Deletion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user
                  account for <strong>{userToDelete?.username}</strong> with email{" "}
                  <strong>{userToDelete?.email}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="py-4">
                <Alert variant="warning" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    To confirm deletion, please type <strong className="font-mono">delete</strong> in the field below.
                  </AlertDescription>
                </Alert>
                
                <Form {...deleteForm}>
                  <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
                    <FormField
                      control={deleteForm.control}
                      name="confirmation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmation</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Type "delete" to confirm'
                              {...field}
                              className="border-red-300 focus:border-red-500"
                              autoComplete="off" // Prevent autofill
                            />
                          </FormControl>
                          <FormDescription className="text-xs mt-1">
                            Type exactly "delete" (case sensitive) to confirm
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          deleteForm.reset();
                          setUserToDelete(null);
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <Button 
                        type="submit" 
                        disabled={deleteUserMutation.isPending || 
                                 deleteForm.watch('confirmation') !== 'delete'} 
                        className="gap-2 bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        {deleteUserMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Delete User
                      </Button>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </div>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Add the Unsaved Changes Dialog */}
          <AlertDialog 
            open={showUnsavedChangesDialog} 
            onOpenChange={setShowUnsavedChangesDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard User Creation?</AlertDialogTitle>
                <AlertDialogDescription>
                  You've started creating a new user. If you exit now, all entered information will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowUnsavedChangesDialog(false)}>
                  Continue Editing
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDiscardChanges}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard Changes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </Container>
  );
}