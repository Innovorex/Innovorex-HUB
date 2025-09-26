// Use environment variable for API base URL
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://server.innovorex.co.in/api';

interface LoginCredentials {
  email: string;
  password: string;
}

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Real API service for ERPNext integration
export const api = {
  get: async (endpoint: string) => {
    const url = `${baseURL}${endpoint}`;
    const token = getAuthToken();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Clear invalid token and throw error instead of redirect
          localStorage.removeItem('authToken');
          throw new Error(`Authentication required: Please login to access this data (HTTP ${response.status})`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  post: async (endpoint: string, body: any, config?: any) => {
    const url = `${baseURL}${endpoint}`;
    const token = getAuthToken();

    // Check if body is FormData for file uploads
    const isFormData = body instanceof FormData;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(config?.headers || {})
        },
        body: isFormData ? body : JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          if (endpoint !== '/auth/login') {
            throw new Error(`Authentication required: Please login to access this data (HTTP ${response.status})`);
          }
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  put: async (endpoint: string, body: any) => {
    const url = `${baseURL}${endpoint}`;
    const token = getAuthToken();

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          throw new Error(`Authentication required: Please login to access this data (HTTP ${response.status})`);
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    const url = `${baseURL}${endpoint}`;
    const token = getAuthToken();

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          throw new Error(`Authentication required: Please login to access this data (HTTP ${response.status})`);
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
