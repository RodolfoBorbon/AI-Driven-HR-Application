import * as z from "zod";
import { USER_ROLES } from "@/features/auth/api/authService";

// Schema for user form
export const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([USER_ROLES.IT_ADMIN, USER_ROLES.HR_MANAGER, USER_ROLES.HR_ASSISTANT], {
    required_error: "Please select a role",
  }),
});

// Schema for delete confirmation
export const deleteConfirmationSchema = z.object({
  confirmation: z.string()
    .min(1, "This field is required")
    .refine(val => val.toLowerCase() === 'delete', {
      message: "Please type 'delete' to confirm"
    })
});

// Types derived from schemas
export type UserFormValues = z.infer<typeof userFormSchema>;
export type DeleteConfirmationValues = z.infer<typeof deleteConfirmationSchema>;

// User data interface
export interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}