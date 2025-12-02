// Use environment variable if set, otherwise use relative URL (proxied by frontend server)
// Can be overridden by creating packages/frontend/.env with: VITE_API_URL=http://your-server-ip:port/api/v1
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on initialization
    this.accessToken = localStorage.getItem('accessToken');
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add authorization header if we have a token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Don't set Content-Type for FormData (browser will set it automatically with boundary)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh token
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          data = { message: text || 'An error occurred' };
        }
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          error: data.error,
        };
        throw error;
      }

      return data;
    } catch (error) {
      // Check if it's already an ApiError
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }
      
      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      // More specific error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        throw {
          message: 'Cannot connect to the server. Please check if the backend is running on ' + this.baseUrl,
          statusCode: 0,
        } as ApiError;
      }
      
      throw {
        message: errorMessage,
        statusCode: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    // If body is FormData, don't stringify it or set Content-Type
    if (body instanceof FormData) {
      return this.request<T>(endpoint, {
        method: 'POST',
        body: body,
        ...options,
      });
    }
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

