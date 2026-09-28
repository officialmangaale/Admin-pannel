"use client";

// Restaurant commission rule API client (platform upgrade Module 3).
//
// Follows the same shape as deliveryPricingService.ts / referralService.ts:
// bearer token from localStorage, the backend's `{success, data, message}`
// envelope unwrapped to `data`, errors surfaced as thrown Errors carrying
// the backend's message.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type CommissionRuleType = "percentage" | "fixed";

export interface CommissionRule {
  id: number;
  restaurant_id?: number | null;
  rule_type: CommissionRuleType;
  rate_permille: number; // 150 = 15.0%
  fixed_amount_cents: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  is_active: boolean;
  priority: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CommissionRuleInput {
  restaurant_id?: number | null;
  rule_type: CommissionRuleType;
  rate_permille: number;
  fixed_amount_cents: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  is_active?: boolean;
  priority?: number;
  start_date?: string | null;
  end_date?: string | null;
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

export const listCommissionRules = (restaurantId?: number, includeInactive = false) => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurant_id", String(restaurantId));
  if (includeInactive) params.set("include_inactive", "true");
  const qs = params.toString();
  return request<CommissionRule[]>(`/admin/commission-rules${qs ? `?${qs}` : ""}`);
};

export const createCommissionRule = (input: CommissionRuleInput) =>
  request<CommissionRule>("/admin/commission-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateCommissionRule = (id: number, input: CommissionRuleInput) =>
  request<CommissionRule>(`/admin/commission-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteCommissionRule = (id: number) =>
  request<null>(`/admin/commission-rules/${id}`, { method: "DELETE" });
