// API Service Layer for Food Admin
// Base URL for the backend API

const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || "http://13.204.68.5:8080";
const RESTAURANT_API_BASE_URL = process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL || "http://13.204.68.5:8082";

// Types
export interface User {
    id: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    name?: string; // Fallback
    email: string;
    role?: string;
    primary_role?: string;
    status?: "active" | "blocked";
    created_at?: string;
    updated_at?: string;
}

export interface AuthResponseData {
    authToken: string;
    display_name: string;
    email: string;
    first_name: string;
    full_name: string;
    last_name: string;
    phone: string;
    primary_role: string;
    user_type: string;
}

export interface LoginResponse {
    status: string;
    message: string;
    data: AuthResponseData;
    statusCode: number;
}

export interface UserListResponse {
    status: string;
    message: string;
    statusCode: number;
    data: {
        users: User[];
    };
}

export interface UserResponse {
    status: string;
    message: string;
    statusCode: number;
    data: {
        user: User;
    };
}

export interface Role {
    id: number;
    name: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface Permission {
    id: number;
    name: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface RoleListResponse {
    status: string;
    message: string;
    statusCode: number;
    data: {
        roles: Role[];
    };
}

export interface RoleResponse {
    status: string;
    message: string;
    statusCode: number;
    data: {
        role: Role;
    };
}

export interface PermissionListResponse {
    status: string;
    message: string;
    statusCode: number;
    data: {
        permissions: Permission[];
    };
}

export interface PermissionResponse {
    status: string;
    message: string;
    statusCode: number;
    data: {
        permission: Permission;
    };
}

export interface Restaurant {
    id: number;
    owner_auth_user_id?: number;
    name: string;
    owner_name: string;
    slug: string;
    type: string;
    category: string;
    gst_number?: string;
    fssai_number?: string;
    logo_url?: string;
    background_url?: string;
    gst_certificate_url?: string;
    fssai_license_url?: string;
    aadhaar_card_url?: string;
    pan_card_url?: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    status: string;
    tags?: string[];
    metadata?: Record<string, any>;
    is_qrunch_purchased?: boolean;
    is_qrunch_requested?: boolean;
    is_restaurant_registered?: boolean;
    upi_vpa?: string;
    wallet_amount?: number;
    phone?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RestaurantListResponse {
    status: string;
    message: string;
    statusCode?: number;
    data: {
        items: Restaurant[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    };
}

export interface RestaurantFilters {
    q?: string;
    city?: string;
    lat?: number;
    lon?: number;
    radius?: number;
    tags?: string;
    status?: string;
    is_restaurant_registered?: string | boolean;
    page?: number;
    limit?: number;
}

export interface UpdateRestaurantRequest {
    name?: string;
    owner_name?: string;
    slug?: string;
    type?: string;
    category?: string;
    gst_number?: string;
    fssai_number?: string;
    street_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    upi_vpa?: string;
    phone?: string;
    description?: string;
    is_qrunch_purchased?: boolean;
    is_qrunch_requested?: boolean;
    is_restaurant_registered?: boolean;
}

export interface UpdateRestaurantFiles {
    logo_url?: File;
    background_url?: File;
    gst_certificate_url?: File;
    fssai_license_url?: File;
    aadhaar_card_url?: File;
    pan_card_url?: File;
}

export interface CreateRoleRequest {
    name: string;
    description: string;
}

export interface CreatePermissionRequest {
    name: string;
    description: string;
}

export interface AssignPermissionRequest {
    role_id: number;
    permission_id: number;
}

export interface UpdateUserRequest {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    email?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('auth_token');
    }
    return null;
};

// Helper function for API requests
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = AUTH_API_BASE_URL
): Promise<T> {
    const token = getAuthToken();

    const headers = new Headers(options.headers);

    // Only set Content-Type if it's not already set and we have a body
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        ...options,
        headers,
    };

    let response: Response;
    try {
        response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
    } catch (error) {
        console.log(error);
        throw new Error("Network error. Please check your connection.", { cause: error });
    }

    // Handle 401 Unauthorized (Automatic Logout)
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Check if we are not already on the login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?error=Session expired. Please login again.';
            }
        }
        throw new Error("Unauthorized: Session expired.");
    }

    const contentType = response.headers.get("content-type");
    const text = await response.text();

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            // Try to parse error message if it's JSON
            if (text && contentType?.includes("application/json")) {
                const errorData = JSON.parse(text);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } else if (text) {
                errorMessage = text;
            }
        } catch (e) {
            // If parsing fails, use default or raw text
        }
        throw new Error(errorMessage);
    }

    // Handle empty responses
    if (!text) return {} as T;

    // Handle JSON parsing safely
    try {
        return JSON.parse(text) as T;
    } catch (error) {
        console.error("Failed to parse API response as JSON:", text);
        // If it's supposed to be JSON but parsing failed, throw error
        if (contentType?.includes("application/json")) {
            throw new Error("Invalid server response format.");
        }
        return text as unknown as T;
    }
}

// Auth API
export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        return apiRequest<LoginResponse>('/users/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// User API
export const userApi = {
    // Get all users
    getAll: async (): Promise<User[]> => {
        return apiRequest<User[]>('/users', {
            method: 'GET'
        }, AUTH_API_BASE_URL);
    },

    // Get user by ID
    getById: async (id: string): Promise<UserResponse> => {
        return apiRequest<UserResponse>(`/users/${id}`, {
            method: 'GET'
        }, AUTH_API_BASE_URL);
    },

    // Update user
    update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
        return apiRequest<UserResponse>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, AUTH_API_BASE_URL);
    },

    // Delete user
    delete: async (id: string): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/users/${id}`, {
            method: 'DELETE',
        }, AUTH_API_BASE_URL);
    },
};

// Role API
export const roleApi = {
    // Create a new role
    create: async (data: CreateRoleRequest): Promise<RoleResponse> => {
        return apiRequest<RoleResponse>('/roles', {
            method: 'POST',
            body: JSON.stringify(data),
        }, AUTH_API_BASE_URL);
    },

    // Get all roles
    getAll: async (): Promise<RoleListResponse> => {
        return apiRequest<RoleListResponse>('/roles', {
            method: 'GET',
        }, AUTH_API_BASE_URL);
    },

    // Assign permission to role
    assignPermission: async (data: AssignPermissionRequest): Promise<{ status: string; message: string; statusCode: number }> => {
        return apiRequest<{ status: string; message: string; statusCode: number }>('/roles/assign', {
            method: 'POST',
            body: JSON.stringify(data),
        }, AUTH_API_BASE_URL);
    },

    // Update role
    update: async (id: number, data: Partial<CreateRoleRequest>): Promise<RoleResponse> => {
        return apiRequest<RoleResponse>(`/roles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, AUTH_API_BASE_URL);
    },

    // Delete role
    delete: async (id: number): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/roles/${id}`, {
            method: 'DELETE',
        }, AUTH_API_BASE_URL);
    },
};

// Permission API
export const permissionApi = {
    // Create a new permission
    create: async (data: CreatePermissionRequest): Promise<PermissionResponse> => {
        return apiRequest<PermissionResponse>('/permissions', {
            method: 'POST',
            body: JSON.stringify(data),
        }, AUTH_API_BASE_URL);
    },

    // Get all permissions
    getAll: async (): Promise<PermissionListResponse> => {
        return apiRequest<PermissionListResponse>('/permissions', {
            method: 'GET',
        }, AUTH_API_BASE_URL);
    },

    // Update permission
    update: async (id: number, data: Partial<CreatePermissionRequest>): Promise<PermissionResponse> => {
        return apiRequest<PermissionResponse>(`/permissions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, AUTH_API_BASE_URL);
    },

    // Delete permission
    delete: async (id: number): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/permissions/${id}`, {
            method: 'DELETE',
        }, AUTH_API_BASE_URL);
    },
};

// Restaurant API
export const restaurantApi = {
    // Get all restaurants with filters and pagination
    getAll: async (filters: RestaurantFilters = {}): Promise<RestaurantListResponse> => {
        const params = new URLSearchParams();
        if (filters.q) params.append('q', filters.q);
        if (filters.city) params.append('city', filters.city);
        if (filters.lat) params.append('lat', filters.lat.toString());
        if (filters.lon) params.append('lon', filters.lon.toString());
        if (filters.radius) params.append('radius', filters.radius.toString());
        if (filters.tags) params.append('tags', filters.tags);
        if (filters.status) params.append('status', filters.status);
        if (filters.is_restaurant_registered !== undefined) params.append('is_restaurant_registered', filters.is_restaurant_registered.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const endpoint = `/restaurants${queryString ? `?${queryString}` : ''}`;

        return apiRequest<RestaurantListResponse>(endpoint, { method: 'GET' }, RESTAURANT_API_BASE_URL);
    },

    // Get restaurant by ID
    getById: async (id: number): Promise<{ status: string; data: Restaurant }> => {
        return apiRequest<{ status: string; data: Restaurant }>(`/restaurants/${id}`, { method: 'GET' }, RESTAURANT_API_BASE_URL);
    },

    // Update restaurant (PUT - full update)
    update: async (id: number, data: UpdateRestaurantRequest): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/restaurants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, RESTAURANT_API_BASE_URL);
    },

    // Patch restaurant (partial update with optional file uploads)
    patch: async (
        id: number,
        data: Partial<UpdateRestaurantRequest>,
        files?: Partial<UpdateRestaurantFiles>
    ): Promise<{ status: string; statusCode: number; message: string; data?: any }> => {
        // If files are provided, use FormData (multipart/form-data)
        if (files && Object.keys(files).length > 0) {
            const formData = new FormData();

            // Add all text fields to FormData
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });

            // Add files to FormData
            Object.entries(files).forEach(([key, file]) => {
                if (file) {
                    formData.append(key, file);
                }
            });

            // Make request without Content-Type header (browser sets it with boundary)
            const token = getAuthToken();
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${RESTAURANT_API_BASE_URL}/restaurants/${id}`, {
                method: 'PATCH',
                headers,
                body: formData,
            });

            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login?error=Session expired. Please login again.';
                    }
                }
                throw new Error("Unauthorized: Session expired.");
            }

            if (!response.ok) {
                const text = await response.text();
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    if (text) errorMessage = text;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        }

        // Otherwise, use JSON (application/json)
        return apiRequest<{ status: string; statusCode: number; message: string; data?: any }>(`/restaurants/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, RESTAURANT_API_BASE_URL);
    },

    // Delete restaurant
    delete: async (id: number): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/restaurants/${id}`, {
            method: 'DELETE',
        }, RESTAURANT_API_BASE_URL);
    },
};

// Order Types
export interface Order {
    order_id: number;
    customer_id: string;
    user_id?: number;
    order_number?: string;
    restaurant_id: number;
    dining_session_id?: number;
    order_type?: "DINE_IN" | "DELIVERY" | "PICKUP";
    order_status: OrderStatus;
    payment_status: string;
    subtotal: number;
    tax_amount: number;
    delivery_fee?: number;
    tip_amount?: number;
    discount_amount?: number;
    total_amount: number;
    is_qrunch: boolean;
    qrunch_customer_name?: string;
    table_no?: number;
    special_instructions?: string;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    created_at: string;
    updated_at: string;
}

export type OrderStatus =
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready_for_pickup"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "failed"
    | "refunded";

export interface OrderItem {
    order_item_id: number;
    menu_item_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    options?: Record<string, unknown>;
    created_at: string;
}

export interface OrderDetails extends Order {
    first_name?: string;
    last_name?: string;
    phone?: string;
    items: OrderDetailItem[];
}

export interface OrderDetailItem {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    menu_item_name: string;
    menu_item_description?: string;
    menu_item_price: number;
    menu_item_image_url?: string;
    menu_item_is_vegetarian?: boolean;
}

export interface OrderFilters {
    status?: string;
    is_qrunch?: string;
    restaurant_id?: number | string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
}

export interface OrderListResponse {
    status: string;
    message: string;
    statusCode?: number;
    data: {
        orders: Order[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    };
}

export interface UpdateOrderRequest {
    payment_status?: string;
    special_instructions?: string;
    tip_amount?: number;
}

// Order API
export const orderApi = {
    // Get all orders with filters and pagination
    getAll: async (filters: OrderFilters = {}): Promise<OrderListResponse> => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.is_qrunch) params.append('is_qrunch', filters.is_qrunch.toString());
        if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id.toString());
        if (filters.from_date) params.append('from_date', filters.from_date);
        if (filters.to_date) params.append('to_date', filters.to_date);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const endpoint = `/restaurants/orders${queryString ? `?${queryString}` : ''}`;

        return apiRequest<OrderListResponse>(endpoint, { method: 'GET' }, RESTAURANT_API_BASE_URL);
    },

    // Get order details
    getDetails: async (orderId: number): Promise<{ status: string; data: OrderDetails }> => {
        // This endpoint uses RESTAURANT_API_BASE_URL as it is under /restaurants/analytics
        return apiRequest<{ status: string; data: OrderDetails }>(`/restaurants/analytics/orders/${orderId}`, { method: 'GET' }, RESTAURANT_API_BASE_URL);
    },

    // Get order status
    getStatus: async (orderId: number): Promise<{ status: string; data: { orderId: number; status: OrderStatus } }> => {
        // Base orders API is also on 8082
        return apiRequest<{ status: string; data: { orderId: number; status: OrderStatus } }>(`/orders/${orderId}/status`, { method: 'GET' }, RESTAURANT_API_BASE_URL);
    },

    // Update order status
    updateStatus: async (orderId: number, status: OrderStatus): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }, RESTAURANT_API_BASE_URL);
    },

    // Patch order (partial update)
    patch: async (orderId: number, data: UpdateOrderRequest): Promise<{ status: string; message: string }> => {
        return apiRequest<{ status: string; message: string }>(`/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, RESTAURANT_API_BASE_URL);
    },

    // Get thermal receipt
    getReceipt: async (orderId: number, width: number = 32): Promise<string> => {
        const token = getAuthToken();
        const response = await fetch(`${RESTAURANT_API_BASE_URL}/restaurants/analytics/orders/${orderId}/receipt?width=${width}`, {
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        });
        return response.text();
    },

    // Download PDF (returns blob URL)
    downloadPdf: async (orderId: number): Promise<string> => {
        const token = getAuthToken();
        const response = await fetch(`${RESTAURANT_API_BASE_URL}/restaurants/analytics/orders/${orderId}/pdf`, {
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        });
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },
};
