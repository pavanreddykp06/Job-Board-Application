import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
          refresh: refreshToken
        });

        // Store the new tokens
        localStorage.setItem('access_token', response.data.access);

        // Update the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear all tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/api/register/', userData);
      // Store tokens and user data in localStorage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/api/login/', credentials);

      // Store tokens and user data in localStorage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data.user;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },



  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.post('/api/verify-email/', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Email verification failed' };
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/api/request-password-reset/', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset request failed' };
    }
  },

  // Reset password
  resetPassword: async (uidb64, token, password, password_confirm) => {
    try {
      const response = await api.post(`/api/reset-password/${uidb64}/${token}/`, { password, password_confirm });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  }
};

// User service
export const userService = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/profile/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Update user profile
 updateProfile: async (userData) => {
  try {
    const response = await api.patch('/api/profile/', userData); // PATCH instead of PUT
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
},


  // Change user password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/api/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Get job seeker profile
  getJobSeekerProfile: async () => {
    try {
      const response = await api.get('/api/jobseeker-profile/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get job seeker profile' };
    }
  },

  // Update job seeker profile
  updateJobSeekerProfile: async (profileData) => {
    try {
      const formData = new FormData();
      // Loop through the profile data and append to form data
      for (const key in profileData) {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      }

      const response = await api.put('/api/jobseeker-profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update job seeker profile' };
    }
  },
};



// Job service
export const jobService = {
  // Search for jobs with filters
  searchJobs: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType) params.append('job_type', filters.jobType);
      if (filters.salary) params.append('salary', filters.salary);

      const response = await api.get(`/api/job-search/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch jobs' };
    }
  },

  // Get all jobs (no filtering)
  getAllJobs: async () => {
    try {
      const response = await api.get('/api/jobs/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch all jobs' };
    }
  },

  // Get a single job by ID
  getJob: async (id) => {
    try {
      const response = await api.get(`/api/jobs/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job details' };
    }
  },

  // Get jobs for the logged-in employer
  getEmployerJobs: async () => {
    try {
      const response = await api.get('/api/employer/jobs/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer jobs' };
    }
  },

  // Create a new job
  createJob: async (jobData) => {
    try {
      const response = await api.post('/api/jobs/', jobData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create job' };
    }
  },

  // Update an existing job
  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/api/jobs/${id}/`, jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update job' };
    }
  },

  // Delete a job
  deleteJob: async (id) => {
    try {
      await api.delete(`/api/jobs/${id}/`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete job' };
    }
  },
};

// Profile service (for company profile)
export const profileService = {
  getCompanyProfile: () => {
    return api.get('/api/company-profile/');
  },

  updateCompanyProfile: (profileData) => {
    return api.put('/api/company-profile/', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Application service
export const messagingService = {
  // Search users for new conversations
  searchUsers: (query) => {
    return api.get(`/api/users/search/?search=${query}`);
  },

  // Get all conversations for the current user
  getConversations: () => {
    return api.get('/api/conversations/');
  },

  // Get messages between current user and another user
  getMessages: (userId) => {
    return api.get(`/api/messages/${userId}/`);
  },

  // Send a message to another user
  sendMessage: (userId, content) => {
    return api.post(`/api/messages/${userId}/send/`, { content });
  },

  // Start a new conversation
  startConversation: (recipientId, message, jobId = null) => {
    return api.post('/api/conversations/start/', {
      recipient_id: recipientId,
      message: message,
      job_id: jobId
    });
  },

  // Get unread message count
  getUnreadCount: () => {
    return api.get('/api/messages/unread-count/');
  },

  // Mark messages as read (handled automatically when fetching messages)
  markAsRead: (userId) => {
    // This is handled automatically in the backend when fetching messages
    return Promise.resolve();
  }
};

export const applicationService = {
  updateApplicationStatus: (applicationId, status) => {
    return api.patch(`/api/applications/${applicationId}/`, { status });
  },

  applyToJob: async (applicationData) => {
    try {
      const response = await api.post('/api/applications/', applicationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit application' };
    }
  },

  getMyApplications: async () => {
    try {
      const response = await api.get('/api/applications/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' };
    }
  },

  getApplicationsForJob: async (jobId) => {
    try {
      const response = await api.get(`/api/jobs/${jobId}/applications/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' };
    }
  },

  downloadResume: async (applicationId) => {
    try {
      const response = await api.get(`/api/applications/${applicationId}/download-resume/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download resume' };
    }
  },
};

// Notification service
export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await api.get('/api/notifications/');
      // Handle paginated response from Django Rest Framework
      return response.data.results || response.data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return []; // Return empty array on error
    }
  },
  markNotificationAsRead: (id) => api.post(`/api/notifications/${id}/read/`),
  markAllNotificationsAsRead: () => api.post('/api/notifications/mark-all-read/'),
};

// Dashboard service
export const dashboardService = {
  getEmployerDashboard: () => api.get('/api/employer-dashboard/'),
  // Get job seeker dashboard data
  getJobSeekerDashboard: async () => {
    try {
      const response = await api.get('/api/jobseeker-dashboard/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job seeker dashboard' };
    }
  },
};

export default api;