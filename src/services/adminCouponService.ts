"use client";

// Admin-level coupon management API client (platform upgrade Module 6).
// Unlike a restaurant owner's own coupon screen, this can manage any
// restaurant's coupons. Follows the same shape as the other rule services.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type CouponDiscountType = "percentage" | "flat" | "free_delivery";
export type CouponFundingSource = "platform" | "restaurant";

export interface AdminCoupon {
  coupon_id: number;
  restaurant_id: number;
  code: string;
  title?: string;
  description?: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount?: number | null;
  min_order_value: number;
  valid_from?: string | null;
  valid_until?: string | null;
  usage_limit?: number | null;
  per_customer_limit: number;
  first_order_only: boolean;
  is_active: boolean;
  created_by_user_id?: string;
  created_at?: string;
  updated_at?: string;
  funding_source: CouponFundingSource;
  new_customer_only: boolean;
  existing_customer_only: boolean;
  payment_method_condition?: string;
}

export interface AdminCouponInput {
  restaurant_id: number;
  code: string;
  title?: string;
  description?: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount?: number | null;
  min_order_value?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  usage_limit?: number | null;
  per_customer_limit?: number;
  first_order_only?: boolean;
  is_active?: boolean;
  funding_source?: CouponFundingSource;
  new_customer_only?: boolean;
  existing_customer_only?: boolean;
  payment_method_condition?: string;
}

export interface CouponUsageSummary {
  coupon_id: number;
  code: string;
  total_redemptions: number;
  total_discount_amount: number;
  platform_funded_total: number;
  restaurant_funded_total: number;
  failed_attempts: number;
  is_expired: boolean;
  is_active: boolean;
  usage_limit?: number | null;
  last_redeemed_at?: string | null;
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

export const listAdminCoupons = (restaurantId?: number, status?: string) => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurant_id", String(restaurantId));
  if (status) params.set("status", status);
  const qs = params.toString();
  return request<{ coupons: AdminCoupon[]; pagination: { page: number; limit: number; has_more: boolean } }>(
    `/admin/coupons${qs ? `?${qs}` : ""}`
  );
};

export const createAdminCoupon = (input: AdminCouponInput) =>
  request<{ coupon: AdminCoupon }>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateAdminCoupon = (couponId: number, input: Partial<AdminCouponInput>) =>
  request<{ coupon: AdminCoupon }>(`/admin/coupons/${couponId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const setAdminCouponStatus = (couponId: number, isActive: boolean) =>
  request<{ coupon_id: number; is_active: boolean }>(`/admin/coupons/${couponId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });

export const getCouponUsageSummary = (couponId: number) =>
  request<CouponUsageSummary>(`/admin/coupons/${couponId}/usage-summary`);
