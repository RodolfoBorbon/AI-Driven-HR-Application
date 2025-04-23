import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Types
export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends UserCredentials {
  username: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  token?: string;
}

// Define available user roles
export enum USER_ROLES {
  IT_ADMIN = "IT Admin",
  HR_MANAGER = "HR Manager",
  HR_ASSISTANT = "HR Assistant"
}

// Permission mapping for roles
const rolePermissions = {
  [USER_ROLES.IT_ADMIN]: [
    "canViewMetrics", 
    "canApproveJobs", 
    "canManageUsers",
    "canCreateJobs",
    "canFormatJobs",
    "canPublishJobs"
  ],
  [USER_ROLES.HR_MANAGER]: [
    "canViewMetrics", 
    "canApproveJobs", 
    "canCreateJobs",
    "canFormatJobs",
    "canPublishJobs"
  ],
  [USER_ROLES.HR_ASSISTANT]: [
    "canCreateJobs",
    "canFormatJobs",
    "canPublishJobs"
  ]
};

// Helper function to check if a user role has a specific permission
export function hasPermission(role: string, permission: string): boolean {
  if (!role) return false;
  
  const permissions = rolePermissions[role as USER_ROLES];
  return permissions ? permissions.includes(permission) : false;
}

// Create a dedicated authentication axios instance
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for adding token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication service functions
const authService = {
  // Register a new user
  register: async (userData: RegisterData): Promise<User> => {
    console.log('authService: Registering new user', { email: userData.email });
    try {
      const response = await authApi.post('/auth/register', userData);
      console.log('authService: Registration successful', response.data);
      return response.data;
    } catch (error) {
      console.error('authService: Registration failed', error);
      
      // Provide more user-friendly error messages for registration
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          const errorMessage = error.response.data.message;
          
          if (errorMessage.includes("exists")) {
            throw new Error('This email or username is already registered. Please use different credentials or sign in.');
          }
        }
      }
      
      throw error;
    }
  },

  // Login user
  login: async (credentials: UserCredentials): Promise<User> => {
    console.log('authService: Attempting login', { email: credentials.email });
    try {
      const response = await authApi.post('/auth/login', credentials);
      console.log('authService: Login successful', response.data);
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('authService: Token stored in localStorage');
      } else {
        console.warn('authService: No token received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('authService: Login failed', error);
      
      // Provide more user-friendly error messages based on status code
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        } else if (error.response?.status === 403) {
          throw new Error('Your account is not authorized to access this application.');
        } else if (error.response?.status === 429) {
          throw new Error('Too many login attempts. Please try again later.');
        } else if (error.response && error.response.status >= 500) {
          throw new Error('Server error. Please try again later or contact support.');
        }
      }
      
      throw new Error('Unable to login. Please check your connection and try again.');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    console.log('authService: Getting current user. Token exists:', !!token);
    
    if (!token) return null;
    
    try {
      const response = await authApi.get('/auth/me');
      console.log('authService: Current user retrieved', response.data);
      return response.data;
    } catch (error) {
      console.error('authService: Failed to get current user', error);
      localStorage.removeItem('token');
      return null;
    }
  },

  // Logout user
  logout: (): void => {
    console.log('authService: Logging out user');
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  }
};

export default authService;
