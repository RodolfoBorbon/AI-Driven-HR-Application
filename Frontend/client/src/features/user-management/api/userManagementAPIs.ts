import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with interceptor for auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Get all users API
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('You do not have permission to access user management');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
    throw error;
  }
};

// Delete user API with improved error handling
export const deleteUser = async (userId: string): Promise<any> => {
  try {
    console.log("API: Raw userId received:", userId);
    
    if (typeof userId !== 'string') {
      console.error("API: UserId is not a string:", userId);
      userId = String(userId).trim();
    }
    
    userId = userId.trim();
    
    console.log("API: Cleaned userId:", userId);
    
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.warn("API: ID format doesn't match standard MongoDB ObjectId pattern:", userId);
    }
    
    console.log("API: Sending delete request for user ID:", userId);
    
    const response = await api.delete(`/users/${userId}`, { 
      timeout: 8000, // 8 second timeout
    });
    
    console.log("API: Delete response received:", response.data);
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || response.data?.message || 'Server returned unsuccessful response');
    }
    
    return response.data;
  } catch (error) {
    console.error('API: Error deleting user:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }

      if (!error.response) {
        throw new Error('Cannot connect to the server. Please check your network connection.');
      }

      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found. They may have already been deleted.');
      }
      if (error.response?.status === 400) {
        if (error.response.data?.error?.includes('Admin')) {
          throw new Error('IT Admin users cannot be deleted for security reasons');
        }
        throw new Error(error.response.data?.error || 'Invalid request data');
      }
      
      const serverErrorMessage = 
        error.response.data?.error || 
        error.response.data?.message || 
        `Server error (${error.response.status})`;
        
      throw new Error(serverErrorMessage);
    }
    
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
};

// Helper function to handle API errors
const handleApiError = (error: unknown): never => {
  console.error('API Error:', error);
  
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || 'An error occurred with the API request';
    throw new Error(message);
  }
  
  throw error instanceof Error ? error : new Error('An unknown error occurred');
};

// Create user API
export const createUser = async (userData: { 
  username: string; 
  email: string; 
  password: string;
  role: string;
}): Promise<any> => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This line is technically not needed since handleApiError always throws
  }
};