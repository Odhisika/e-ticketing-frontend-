import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your Django backend URL
const BASE_URL = 'http://192.168.1.223:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    console.log('Token from AsyncStorage:', token); // Debug log
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization); // Debug log
    } else {
      console.log('No token found in AsyncStorage'); // Debug log
    }
    
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    }); // Debug log
    
    return config;
  },
  (error) => {
    console.log('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      data: response.data
    }); // Debug log
    return response;
  },
  async (error) => {
    console.log('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    }); // Debug log
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Attempting token refresh...');

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        console.log('Refresh token:', refreshToken);
        
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem('access_token', access);
          console.log('Token refreshed successfully');

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        // You might want to emit an event here to redirect to login
      }
    }

    return Promise.reject(error);
  }
);

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


export interface Ticket {
  id: string;
  ticket_id: string;
  qr_code?: string;  // URL to PNG image
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

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log('Login request:', data);
      const res = await api.post('/auth/login/', data);
      console.log('Login response:', res.data);
      
      const { access, refresh, user } = res.data;

      // Store tokens
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('Tokens stored successfully');

      return {
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
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      console.log('Register request:', data);
      const res = await api.post('/auth/register/', data);
      console.log('Register response:', res.data);
      
      const { access, refresh, user } = res.data;

      // Store tokens
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return {
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
    } catch (error) {
      console.log('Register error:', error);
      throw error;
    }
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const res = await api.post('/auth/token/refresh/', { refresh });
    return res.data;
  },
};

// Events API
export const eventsAPI = {
  getEvents: () => api.get<Event[]>('/events/'),
  getEvent: (id: string) => api.get<Event>(`/events/${id}/`),
};

// src/services/api.ts
export const ordersAPI = {
  debugAuth: () => api.get('/orders/debug-auth/'),
  createOrder: async (data: {
    event_id: string;
    quantity: number;
    payment_method: string;
  }) => {
    console.log('Creating order with data:', data);
    const token = await AsyncStorage.getItem('access_token');
    const user = await AsyncStorage.getItem('user');
    console.log('Token available:', !!token);
    console.log('User data:', user);
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    try {
      console.log('Testing debug order data endpoint...');
      const debugResponse = await api.post('/orders/debug-order-data/', data);
      console.log('Debug order data response:', debugResponse.data);
    } catch (debugError: any) {
      console.log('Debug order data error:', debugError.response?.data);
    }
    return api.post<Order>('/orders/', data);
  },
  getOrders: () => api.get<Order[]>('/orders/list/'), 
  getOrder: (id: string) => api.get<Order>(`/orders/${id}/`),
  updateOrderStatus: (id: string, status: string) =>
    api.patch<Order>(`/orders/${id}/`, { status }),
};

// Admin API
export const adminAPI = {
  getPendingOrders: () => api.get<Order[]>('/admin/orders/?status=pending'),
  approveOrder: (orderId: string) =>
    api.post(`/admin/orders/${orderId}/approve/`),
  rejectOrder: (orderId: string) =>
    api.post(`/admin/orders/${orderId}/reject/`),
};

// Tickets API
export const ticketsAPI = {
  // Get all tickets
  getTickets: () => api.get<Ticket[]>('/tickets/'),

  // Get ticket detail by ID
  getTicket: (ticketId: string) =>
    api.get<Ticket>(`/tickets/${ticketId}/`),

  // Validate ticket by ID
  validateTicket: (ticketId: string) =>
    api.post('/tickets/validate/', { ticket_id: ticketId }),
};

export const paymentAPI = {
  getPaymentMethods: () => api.get<PaymentMethod[]>('/payment-methods/'),
  submitPaymentConfirmation: (orderId: string, transactionId: string, screenshot: any) => {
    const formData = new FormData();
    formData.append('transaction_id', transactionId);
    if (screenshot) {
      formData.append('payment_screenshot', {
        uri: screenshot.uri,
        type: screenshot.type || 'image/jpeg',
        name: screenshot.fileName || `screenshot_${Date.now()}.jpg`,
      });
    }
    return api.post<PaymentConfirmation>(`/payments/${orderId}/submit-confirmation/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};


export default api;







