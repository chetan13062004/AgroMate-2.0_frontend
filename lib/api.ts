const getApiBaseUrl = () => {
  // In development, use the full URL to the local backend
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  // In production, use the full URL
  return process.env.NEXT_PUBLIC_API_URL || 'https://agromate-3-621t.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } else if (status === 403) {
        // Handle forbidden access
        console.error('Access denied: You do not have permission to access this resource');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout: The server took too long to respond');
    } else if (!navigator.onLine) {
      console.error('Network error: Please check your internet connection');
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  // The server response body is stored directly in `data`.
  // For most endpoints, that object contains the fields relevant to the caller
  // (e.g. `{ products: Product[] }`, `{ product: Product }`, `{ user: User }`, etc.)
  data?: T;

  // Optional error information set when the HTTP status is not OK.
  error?: {
    message: string;
    statusCode?: number;
  } | string;

  // Raw HTTP status code returned by fetch.
  status: number;

  // Convenience field copied from the response body when present (e.g. "success")
  message?: string;
}

interface UserData {
  name: string;
  email: string;
  password: string;
  role?: string;
  location?: any;
  avatar?: string;
  farmSize?: string;
  categories?: string[];
}

export async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data: any = null,
  token?: string
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  console.log(`[API] ${method} ${url}`);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add Authorization header if token is provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include', // Important for cookies
    cache: 'no-cache',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return { status: 204, data: null } as unknown as ApiResponse<T>;
    }
    
    let responseData;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (jsonError) {
      console.error('[API] Failed to parse JSON response:', jsonError);
      responseData = {};
    }

    console.log(`[API] Response from ${endpoint}:`, { 
      status: response.status,
      statusText: response.statusText,
      data: responseData 
    });

    if (!response.ok) {
      const errorMessage = 
        responseData.message || 
        responseData.error?.message || 
        response.statusText || 
        'Something went wrong';
      
      console.error(`[API] Request failed: ${errorMessage}`, { 
        status: response.status,
        endpoint,
        response: responseData 
      });
      
      return {
        error: {
          message: errorMessage,
          statusCode: response.status,
        },
        status: response.status,
        data: responseData,
      };
    }

    return { 
      data: responseData, 
      status: response.status,
      message: responseData.message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    console.error(`[API] Request error: ${errorMessage}`, { 
      url,
      error,
      timestamp: new Date().toISOString()
    });
    
    return {
      error: {
        message: errorMessage,
        statusCode: error instanceof TypeError && error.message.includes('Failed to fetch') ? 503 : 500,
      },
      status: 500,
      message: errorMessage,
    };
  }
}

interface AuthResponse {
  /**
   * Some endpoints return the user and token directly in the response body (e.g. { user, token }).
   */
  user?: any;
  token?: string;
  message?: string;

  /**
   * Others wrap the useful payload in a second "data" object
   * (e.g. { data: { user, token } }).
   * Making this field optional lets us support both shapes
   * while keeping type-safety elsewhere.
   */
  data?: {
    user?: any;
    token?: string;
    message?: string;
  };
}

// Product related interfaces
export interface ProductImage {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  status: string;
  description: string;
  images: ProductImage[];  // Array of Cloudinary images
  imageUrl?: string;  // Deprecated - kept for backward compatibility
  lowStockThreshold: number;
  featured: boolean;
  totalSold: number;
  revenue: number;
  views: number;
  farmer?: string | {
    _id: string;
    name: string;
    avatar?: string;
  };
  /**
   * Whether the product is certified organic. Optional because not every item
   * has this metadata.
   */
  isOrganic?: boolean;
  /**
   * Convenience helper computed on the API for Qty × Price, used in dashboards.
   */
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  description: string;
  lowStockThreshold?: number;
  status?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

// Order API methods
export interface OrderItem {
  // Populated product object or just product name for convenience
  name?: string
  product: Product | string
  quantity: number
  price: number
  /**
   * Optional direct image URL when the backend provides it in the order item itself.
   * Components such as <OrdersPage /> display a thumbnail using this field when present.
   */
  image?: string
}
export interface Order {
  id?: string // alias for _id used in UI
  customer?: string
  customerPhone?: string
  farmer?: string
  farmerPhone?: string
  orderDate?: string
  deliveryDate?: string
  deliveryAddress?: string
  paymentMethod?: string
  _id: string
  user: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: string
  createdAt: string
  updatedAt: string
}

export const orderApi = {
  async getMyOrders(): Promise<ApiResponse<Order[]>> {
    return apiRequest<Order[]>('/orders', 'GET')
  },
  async getFarmerOrders(): Promise<ApiResponse<Order[]>> {
    return apiRequest<Order[]>('/orders/farmer', 'GET')
  },
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return apiRequest<Order>(`/orders/${id}`, 'GET')
  },
  async deleteOrder(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/orders/${id}`, 'DELETE')
  }
}

// Product API methods
export const productApi = {
  // Get all products (for buyers)
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return apiRequest<Product[]>('/products', 'GET');
  },
  // Get all products for the current farmer
  async getFarmerProducts(): Promise<ApiResponse<{ products: Product[] }>> {
    return apiRequest<{ products: Product[] }>('/products/farmer', 'GET');
  },

  // Get a single product by ID
  async getProduct(id: string): Promise<ApiResponse<{ product: Product }>> {
    return apiRequest<{ product: Product }>(`/products/${id}`, 'GET');
  },

  // Create a new product
  async createProduct(data: CreateProductDto): Promise<ApiResponse<{ product: Product }>> {
    return apiRequest<{ product: Product }>('/products', 'POST', data);
  },

  // Update a product
  async updateProduct(
    id: string,
    data: Partial<CreateProductDto>
  ): Promise<ApiResponse<{ product: Product }>> {
    return apiRequest<{ product: Product }>(`/products/${id}`, 'PATCH', data);
  },

  // Delete a product
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/products/${id}`, 'DELETE');
  },

  // Toggle featured status
  async toggleFeatured(id: string): Promise<ApiResponse<{ product: Product }>> {
    return apiRequest<{ product: Product }>(`/products/${id}/toggle-featured`, 'PATCH');
  }
};

export const authApi = {
  async register(userData: UserData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiRequest<AuthResponse>('/auth/register', 'POST', userData);
    
    // If we got a token in the response, store it
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    } else if (response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response;
  },

  async login(credentials: { email: string; password: string, role?: string }): Promise<ApiResponse<AuthResponse>> {
    const response = await apiRequest<AuthResponse>('/auth/login', 'POST', credentials);
    
    // If we got a token in the response, store it
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    } else if (response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response;
  },

  async getMe(): Promise<ApiResponse<{ user: any }>> {
    const response = await apiRequest<{ user: any }>('/auth/me');
    
    // If we're not authorized, clear any stored token
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
    }
    
    return response;
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiRequest<void>('/auth/logout', 'POST');
      // Clear the token regardless of the response status
      localStorage.removeItem('token');
      return response;
    } catch (error) {
      // Even if the API call fails, clear the token
      localStorage.removeItem('token');
      throw error;
    }
  },
};
