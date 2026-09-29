"use client";

// User analytics API client (platform upgrade Module 8).

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type ActivityFilter =
  | ""
  | "active_today"
  | "active_7d"
  | "inactive_7d"
  | "inactive_30d"
  | "inactive_60d"
  | "inactive_90d"
  | "new_users"
  | "returning_users"
  | "has_orders"
  | "no_orders"
  | "profit_generating"
  | "loss_making";

export interface UserAnalytics {
  user_id: string;
  name: string;
  phone: string;
  registered_at: string;
  last_login_at?: string | null;
  last_active_at?: string | null;
  last_order_at?: string | null;
  total_active_days: number;
  total_sessions: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  total_gmv: number;
  average_order_value: number;
  has_pricing_data: boolean;
  total_delivery_fees_paid: number;
  total_platform_fees_paid: number;
  total_markup_paid: number;
  total_discount_received: number;
  total_coupon_benefit: number;
  total_referral_benefit: number;
  total_refunds: number;
  total_platform_revenue_generated: number;
  estimated_net_profit_loss: number;
}

export interface UserAnalyticsPage {
  users: UserAnalytics[];
  page: number;
  limit: number;
  has_more: boolean;
}

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${RESTAURANT_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      parsed?.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  return (parsed?.data ?? parsed) as T;
}

export const listUserAnalytics = (params: {
  search?: string;
  activity?: ActivityFilter;
  registeredFrom?: string;
  registeredTo?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.activity) qs.set("activity", params.activity);
  if (params.registeredFrom) qs.set("registered_from", params.registeredFrom);
  if (params.registeredTo) qs.set("registered_to", params.registeredTo);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return request<UserAnalyticsPage>(`/admin/user-analytics${s ? `?${s}` : ""}`);
};
