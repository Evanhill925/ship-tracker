// API Service for Ship Tracker Frontend
// Handles all communication with the backend API

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Network error occurred' };
    }
    
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData.error || 'UNKNOWN_ERROR'
    );
  }
  
  return await response.json();
};

// Helper function to build query parameters
const buildQueryParams = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  return searchParams.toString();
};

// API Service Class
class ApiService {
  
  /**
   * Fetch active ships with their latest positions
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of ships to fetch (default: 50)
   * @param {number} options.offset - Number of ships to skip (default: 0)
   * @param {string} options.search - Search term for ship name, call sign, or destination
   * @returns {Promise<Object>} API response with ship data
   */
  static async fetchActiveShips(options = {}) {
    const { limit = 50, offset = 0, search = '' } = options;
    
    const queryParams = buildQueryParams({
      limit,
      offset,
      search
    });
    
    const url = `${API_BASE}/ships/active${queryParams ? `?${queryParams}` : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      return await handleResponse(response);
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new ApiError('Request timed out', 408, 'TIMEOUT_ERROR');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError('Unable to connect to server', 0, 'CONNECTION_ERROR');
      }
      throw error;
    }
  }

  /**
   * Check API health and get basic statistics
   * @returns {Promise<Object>} API health response
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout for health check
      });
      
      return await handleResponse(response);
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new ApiError('Health check timed out', 408, 'TIMEOUT_ERROR');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError('Unable to connect to server', 0, 'CONNECTION_ERROR');
      }
      throw error;
    }
  }

  /**
   * Test legacy hello endpoint
   * @returns {Promise<Object>} Hello response
   */
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE}/hello`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      return await handleResponse(response);
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new ApiError('Connection test timed out', 408, 'TIMEOUT_ERROR');
      }
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError('Unable to connect to server', 0, 'CONNECTION_ERROR');
      }
      throw error;
    }
  }
}

// Export both the class and individual functions for flexibility
export default ApiService;

export const { 
  fetchActiveShips, 
  checkHealth, 
  testConnection 
} = ApiService;

// Export the error class for error handling
export { ApiError };

// Helper function to determine connection status based on error
export const getConnectionStatus = (error) => {
  if (!error) return 'connected';
  
  if (error.code === 'CONNECTION_ERROR' || error.status === 0) {
    return 'disconnected';
  }
  
  if (error.code === 'TIMEOUT_ERROR' || error.status === 408) {
    return 'timeout';
  }
  
  if (error.status >= 500) {
    return 'server_error';
  }
  
  return 'error';
};

// Helper function to get user-friendly error messages
export const getErrorMessage = (error) => {
  const defaultMessages = {
    'CONNECTION_ERROR': 'Unable to connect to the ship tracking service. Please check your internet connection.',
    'TIMEOUT_ERROR': 'Request timed out. The server may be experiencing high load.',
    'FETCH_SHIPS_ERROR': 'Failed to load ship data. Please try refreshing the page.',
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
  };
  
  return error.message || defaultMessages[error.code] || defaultMessages['UNKNOWN_ERROR'];
};