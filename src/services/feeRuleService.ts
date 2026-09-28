"use client";

// Dynamic fee rule API client (platform upgrade Module 5: Platform Fee and
// Additional Charges). Follows the same shape as the other rule services.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type FeeRuleType = "percentage" | "fixed";

export interface DynamicFeeRule {
  id: number;
  fee_code: string;
  fee_name: string;
  customer_title: string;
  description?: string;
  rule_type: FeeRuleType;
  rate_permille: number;
  fixed_amount_cents: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  restaurant_id?: number | null;
  category_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_taxable: boolean;
  is_customer_visible: boolean;
  is_active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface DynamicFeeRuleInput {
  fee_code: string;
  fee_name: string;
  customer_title: string;
  description?: string;
  rule_type: FeeRuleType;
  rate_permille: number;
  fixed_amount_cents: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  restaurant_id?: number | null;
  category_id?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  is_taxable?: boolean;
  is_customer_visible?: boolean;
  is_active?: boolean;
  priority?: number;
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
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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

export const listFeeRules = (restaurantId?: number, includeInactive = false) => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurant_id", String(restaurantId));
  if (includeInactive) params.set("include_inactive", "true");
  const qs = params.toString();
  return request<DynamicFeeRule[]>(`/admin/fee-rules${qs ? `?${qs}` : ""}`);
};

export const createFeeRule = (input: DynamicFeeRuleInput) =>
  request<DynamicFeeRule>("/admin/fee-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateFeeRule = (id: number, input: DynamicFeeRuleInput) =>
  request<DynamicFeeRule>(`/admin/fee-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteFeeRule = (id: number) =>
  request<null>(`/admin/fee-rules/${id}`, { method: "DELETE" });
