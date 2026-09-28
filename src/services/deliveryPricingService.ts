"use client";

// Delivery pricing API client (platform upgrade Module 2).
//
// Follows the same shape as referralService.ts: bearer token from
// localStorage, the backend's `{success, data, message}` envelope unwrapped
// to `data`, errors surfaced as thrown Errors carrying the backend's
// message.
//
// These endpoints only manage rules/settings — they are not yet consumed by
// live checkout (see restaurant-service/services/delivery_pricing.go for
// why), so editing here is safe to try without affecting real orders until
// that follow-up ships.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export interface DeliveryPricingRule {
  id: number;
  restaurant_id?: number | null;
  min_distance_km: number;
  max_distance_km: number;
  fee_amount: number;
  is_active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface DeliveryPricingRuleInput {
  restaurant_id?: number | null;
  min_distance_km: number;
  max_distance_km: number;
  fee_amount: number;
  is_active?: boolean;
  priority?: number;
}

export interface DeliveryPricingSettings {
  id: number;
  restaurant_id?: number | null;
  max_delivery_distance_km: number;
  free_delivery_min_cart_value?: number | null;
  night_charge_amount: number;
  night_start_time?: string | null;
  night_end_time?: string | null;
  peak_hour_charge_amount: number;
  peak_start_time?: string | null;
  peak_end_time?: string | null;
  surge_enabled: boolean;
  surge_charge_amount: number;
  rain_enabled: boolean;
  rain_charge_amount: number;
  updated_at?: string;
  updated_by?: string;
}

export interface DeliveryFeePreviewRequest {
  restaurant_id: number;
  restaurant_lat: number;
  restaurant_lng: number;
  customer_lat: number;
  customer_lng: number;
  cart_subtotal?: number;
}

export interface DeliveryFeePreviewResult {
  distance_km: number;
  max_distance_km: number;
  within_max_distance: boolean;
  base_fee_amount: number;
  free_delivery_applied: boolean;
  night_charge_applied: boolean;
  night_charge_amount: number;
  peak_charge_applied: boolean;
  peak_charge_amount: number;
  surge_applied: boolean;
  surge_charge_amount: number;
  rain_applied: boolean;
  rain_charge_amount: number;
  final_fee_amount: number;
  rule_source: "restaurant_slab" | "global_slab" | "unconfigured";
  rule_id?: number;
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

export const listDeliveryPricingRules = (
  restaurantId?: number,
  includeInactive = false
) => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurant_id", String(restaurantId));
  if (includeInactive) params.set("include_inactive", "true");
  const qs = params.toString();
  return request<DeliveryPricingRule[]>(
    `/admin/delivery-pricing/rules${qs ? `?${qs}` : ""}`
  );
};

export const createDeliveryPricingRule = (input: DeliveryPricingRuleInput) =>
  request<DeliveryPricingRule>("/admin/delivery-pricing/rules", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateDeliveryPricingRule = (
  id: number,
  input: DeliveryPricingRuleInput
) =>
  request<DeliveryPricingRule>(`/admin/delivery-pricing/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteDeliveryPricingRule = (id: number) =>
  request<null>(`/admin/delivery-pricing/rules/${id}`, { method: "DELETE" });

export const getDeliveryPricingSettings = (restaurantId?: number) => {
  const qs = restaurantId ? `?restaurant_id=${restaurantId}` : "";
  return request<DeliveryPricingSettings>(
    `/admin/delivery-pricing/settings${qs}`
  );
};

export const saveDeliveryPricingSettings = (
  settings: Partial<DeliveryPricingSettings> & {
    max_delivery_distance_km: number;
  }
) =>
  request<DeliveryPricingSettings>("/admin/delivery-pricing/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

export const previewDeliveryFee = (input: DeliveryFeePreviewRequest) =>
  request<DeliveryFeePreviewResult>("/admin/delivery-pricing/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
