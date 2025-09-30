// src/services/api.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================
// CONFIG
// ==============================
const BASE_URL = 'http://192.168.1.223:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================
// ERROR HANDLING UTILITIES
// ==============================
const getNetworkErrorMessage = (error: AxiosError): string => {
  // Check if it's a network error (no response received)
  if (!error.response) {
    // Different types of connection issues
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      return 'Server is currently unavailable. Please try again later.';
    }
    
    if (error.message.includes('Network Error')) {
      return 'Connection failed. Please check your internet connection and try again.';
    }
    
    return 'Unable to connect to the server. Please try again.';
  }
  
  // Handle HTTP status codes with user-friendly messages
  const status = error.response.status;
  switch (status) {
    case 400:
      return 'Invalid request. Please check your information and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timed out. Please try again.';
    case 409:
      return 'There was a conflict with your request. Please try again.';
    case 422:
      return 'Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error occurred. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again.';
    case 503:
      return 'Service is currently under maintenance. Please try again later.';
    case 504:
      return 'Request timed out. Please try again.';
    default:
      if (status >= 500) {
        return 'Server error occurred. Please try again later.';
      } else if (status >= 400) {
        return 'Something went wrong with your request. Please try again.';
      }
      return 'An unexpected error occurred. Please try again.';
  }
};

const extractErrorMessage = (error: AxiosError): string => {
  // First check if there's a server response with error details
  if (error.response?.data) {
    const data = error.response.data as any;
    
    // Common API error message fields
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.message) return data.message;
    
    // Handle validation errors (usually arrays or objects)
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors[0];
    }
    
    // Handle field-specific errors
    if (typeof data === 'object') {
      const firstErrorField = Object.keys(data)[0];
      if (firstErrorField && Array.isArray(data[firstErrorField])) {
        return `${firstErrorField}: ${data[firstErrorField][0]}`;
      }
      if (firstErrorField && typeof data[firstErrorField] === 'string') {
        return data[firstErrorField];
      }
    }
  }
  
  // Fall back to network error handling
  return getNetworkErrorMessage(error);
};

// ==============================
// ENHANCED SAFE HANDLER
// ==============================
type ApiResponse<T> = {
  data?: T;
  error?: string;
  status?: number;
};

async function safeRequest<T>(promise: Promise<any>): Promise<ApiResponse<T>> {
  try {
    const res = await promise;
    return { data: res.data, status: res.status };
  } catch (err) {
    const error = err as AxiosError<any>;
    return {
      error: extractErrorMessage(error),
      status: error.response?.status,
    };
  }
}

// ==============================
// INTERCEPTORS
// ==============================

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh with better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear all tokens if refresh fails
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        
        // Create a new error with user-friendly message
        const newError = new Error('Your session has expired. Please log in again.');
        return Promise.reject(newError);
      }
    }

    return Promise.reject(error);
  }
);

// ==============================
// INTERFACES (unchanged)
// ==============================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    is_admin: boolean;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  price: string;
  image: string;
  location: string;
  organizer: string;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  qr_code?: string;
  is_used: boolean;
  created_at: string;
  order: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    event: {
      id: string;
      title: string;
      date: string;
      location: string;
    };
    quantity: number;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'mobile_money';
  name: string;
  details: {
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    branch?: string;
    sort_code?: string;
    number?: string;
    network?: string;
  };
}

export interface PaymentConfirmation {
  id: string;
  order: Order;
  transaction_id?: string;
  payment_screenshot?: string;
  confirmation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_id: string;
  event: Event;
  quantity: number;
  total_amount: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  tickets: Ticket[];
  payment_confirmation?: PaymentConfirmation;
}

// ==============================
// ENHANCED API METHODS
// ==============================
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const res = await api.post('/auth/login/', data);
      const { access, refresh, user } = res.data;

      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      const authResponse: AuthResponse = {
        access,
        refresh,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          phone: user.phone,
          is_admin: user.is_admin,
        },
      };

      return { data: authResponse, status: res.status };
    } catch (error) {
      return { error: extractErrorMessage(error as AxiosError) };
    }
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const res = await api.post('/auth/register/', data);
      const { access, refresh, user } = res.data;

      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      const authResponse: AuthResponse = {
        access,
        refresh,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          phone: user.phone,
          is_admin: user.is_admin,
        },
      };

      return { data: authResponse, status: res.status };
    } catch (error) {
      return { error: extractErrorMessage(error as AxiosError) };
    }
  },

  refreshToken: async (refresh: string): Promise<ApiResponse<{ access: string }>> => {
    return safeRequest(api.post('/auth/token/refresh/', { refresh }));
  },
};

// ==============================
// EVENTS API
// ==============================
export const eventsAPI = {
  getEvents: (): Promise<ApiResponse<Event[]>> => safeRequest(api.get('/events/')),
  getEvent: (id: string): Promise<ApiResponse<Event>> => safeRequest(api.get(`/events/${id}/`)),
};

// ==============================
// ORDERS API
// ==============================
export const ordersAPI = {
  createOrder: async (data: {
    event_id: string;
    quantity: number;
    payment_method: string;
  }): Promise<ApiResponse<Order>> => {
    return safeRequest(api.post('/orders/', data));
  },
  
  getOrders: (): Promise<ApiResponse<Order[]>> => safeRequest(api.get('/orders/list/')),
  
  getOrder: (id: string): Promise<ApiResponse<Order>> => safeRequest(api.get(`/orders/${id}/`)),
  
  updateOrderStatus: (id: string, status: string): Promise<ApiResponse<Order>> =>
    safeRequest(api.patch(`/orders/${id}/`, { status })),
};

// ==============================
// ADMIN API
// ==============================
export const adminAPI = {
  getPendingOrders: (): Promise<ApiResponse<Order[]>> => 
    safeRequest(api.get('/admin/orders/?status=pending')),
    
  approveOrder: (orderId: string): Promise<ApiResponse<any>> =>
    safeRequest(api.post(`/admin/orders/${orderId}/approve/`)),
    
  rejectOrder: (orderId: string): Promise<ApiResponse<any>> =>
    safeRequest(api.post(`/admin/orders/${orderId}/reject/`)),
};

// ==============================
// TICKETS API
// ==============================
export const ticketsAPI = {
  getTickets: (): Promise<ApiResponse<Ticket[]>> => safeRequest(api.get('/tickets/')),
  
  getTicket: (ticketId: string): Promise<ApiResponse<Ticket>> => 
    safeRequest(api.get(`/tickets/${ticketId}/`)),
    
  validateTicket: (ticketId: string): Promise<ApiResponse<any>> =>
    safeRequest(api.post('/tickets/validate/', { ticket_id: ticketId })),
};

// ==============================
// PAYMENTS API
// ==============================
export const paymentAPI = {
  getPaymentMethods: (): Promise<ApiResponse<PaymentMethod[]>> => 
    safeRequest(api.get('/payment-methods/')),

  submitPaymentConfirmation: async (
    orderId: string,
    transactionId: string,
    screenshot: any
  ): Promise<ApiResponse<any>> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        return { error: 'Authentication required. Please log in again.' };
      }

      const formData = new FormData();
      formData.append('transaction_id', transactionId);

      if (screenshot) {
        const fileData = {
          uri: screenshot.uri,
          type: screenshot.type || 'image/jpeg',
          name: screenshot.fileName || `screenshot_${Date.now()}.jpg`,
        };
        formData.append('payment_screenshot', fileData as any);
      }

      const response = await axios.post(
        `${BASE_URL}/payments/${orderId}/submit-confirmation/`,
        formData,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      return { data: response.data, status: response.status };
    } catch (error) {
      return { error: extractErrorMessage(error as AxiosError) };
    }
  },
};

export default api;