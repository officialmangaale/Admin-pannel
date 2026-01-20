// Centralized constants for the application

export const TIMEOUTS = {
    SUCCESS_MESSAGE: 3000,
    ERROR_MESSAGE: 5000,
} as const;

export const PAGINATION = {
    DEFAULT_LIMIT: 10,
    ORDERS_LIMIT: 20,
} as const;

export const DATE_RANGES = {
    RECENT_DAYS: 7,
} as const;

export const ORDER_STATUSES = {
    ALL: 'all',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY_FOR_PICKUP: 'ready_for_pickup',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
    REFUNDED: 'refunded',
} as const;

export const HTTP_STATUS = {
    UNAUTHORIZED: 401,
    OK: 200,
} as const;
