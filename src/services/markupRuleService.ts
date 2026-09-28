"use client";

// Item markup rule API client (platform upgrade Module 4).
//
// Follows the same shape as commissionRuleService.ts / deliveryPricingService.ts.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type MarkupRuleScope = "item" | "restaurant" | "category" | "global";
export type MarkupRuleType = "percentage" | "fixed";

export interface ItemMarkupRule {
  id: number;
  scope: MarkupRuleScope;
  menu_item_id?: number | null;
  restaurant_id?: number | null;
  category_id?: number | null;
  rule_type: MarkupRuleType;
  rate_permille: number;
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

export interface ItemMarkupRuleInput {
  scope: MarkupRuleScope;
  menu_item_id?: number | null;
  restaurant_id?: number | null;
  category_id?: number | null;
  rule_type: MarkupRuleType;
  rate_permille: number;
  fixed_amount_cents: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
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

export const listMarkupRules = (
  scope?: MarkupRuleScope,
  scopeId?: number,
  includeInactive = false
) => {
  const params = new URLSearchParams();
  if (scope) params.set("scope", scope);
  if (scopeId) params.set("scope_id", String(scopeId));
  if (includeInactive) params.set("include_inactive", "true");
  const qs = params.toString();
  return request<ItemMarkupRule[]>(`/admin/markup-rules${qs ? `?${qs}` : ""}`);
};

export const createMarkupRule = (input: ItemMarkupRuleInput) =>
  request<ItemMarkupRule>("/admin/markup-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateMarkupRule = (id: number, input: ItemMarkupRuleInput) =>
  request<ItemMarkupRule>(`/admin/markup-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteMarkupRule = (id: number) =>
  request<null>(`/admin/markup-rules/${id}`, { method: "DELETE" });
