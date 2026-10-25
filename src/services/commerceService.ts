"use client";

const base = process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL || "https://restaurant-prod.mangaale.com";
export type MerchantType = "restaurant" | "grocery";
export interface CommercePolicy {
  merchant_type: MerchantType;
  merchant_id: number;
  business_model: "vendor" | "owned_store";
  enabled: boolean;
  commission_permille: number;
  commission_fixed_cents: number;
  rider_pay_cents: number;
  version: number;
  updated_by?: string;
}
export interface FinanceEntry {
  id: number; order_id: number | null; entry_type: string; amount_cents: number;
  merchant_earning_cents: number | null; platform_revenue_cents: number | null;
  rider_cost_cents: number | null; merchant_cash_cents: number | null;
  reference: string | null; created_at: string;
  vendor_cost_cents: number;
}
export interface GroceryFinances { balance_cents: number; entries: FinanceEntry[] }
export interface GroceryPreview {
	 vendor_due_cents: number;
  merchant_earning_cents: number; commission_cents: number; rider_pay_cents: number;
  platform_revenue_cents: number; platform_margin_cents: number; merchant_payable_cents: number;
}
export interface DispatchConfig {
  enabled: boolean; restaurant_ids: number[];
  location_max_age_seconds: number; search_max_age_seconds: number; version: number;
}
async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${base}${path}`, {
    method, cache: "no-store",
    headers: { Authorization: `Bearer ${token || ""}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || result?.error?.message || "Commerce request failed");
  return result.data as T;
}
export const getCommercePolicy = (kind: MerchantType, id: number) => request<CommercePolicy>(`/admin/commerce/policies/${kind}/${id}`);
export const saveCommercePolicy = (policy: CommercePolicy) => request<CommercePolicy>(`/admin/commerce/policies/${policy.merchant_type}/${policy.merchant_id}`, "PUT", policy);
export const getGroceryFinances = (id: number) => request<GroceryFinances>(`/admin/grocery-merchants/${id}/finances`);
export const recordGroceryPayout = (id: number, amount_cents: number, reference: string, direction: "to_merchant" | "from_merchant") => request<null>(`/admin/grocery-merchants/${id}/payouts`, "POST", { amount_cents, reference, direction });
export const previewGrocery = (policy: CommercePolicy, subtotal_cents: number, discount_cents: number, delivery_fee_cents: number, platform_rider: boolean, cash: boolean, vendor_cost_cents = 0) =>
  request<GroceryPreview>("/admin/commerce/preview", "POST", { policy, subtotal_cents, discount_cents, delivery_fee_cents, platform_rider, cash, vendor_cost_cents });
export const getDispatchConfig = () => request<DispatchConfig>("/admin/commerce/dispatch");
export const saveDispatchConfig = (config: DispatchConfig) => request<DispatchConfig>("/admin/commerce/dispatch", "PUT", config);

export interface ConsignmentSource {
  id?: number; store_merchant_id: number; fulfillment_store_id: number;
  grocery_product_id: number; vendor_merchant_id: number; unit_cost_cents: number;
  enabled: boolean; version: number;
}
export interface ConsignmentSourceRow { source: ConsignmentSource; product_name: string; vendor_name: string; store_name: string }
export interface ConsignmentVendor { vendor_merchant_id: number; vendor_name: string; balance_cents: number }
export interface ConsignmentOptions {
  stores: { id: number; name: string }[];
  products: { id: number; name: string; price_cents: number; store_ids: number[] }[];
  vendors: { id: number; name: string; status: string }[];
}
export const getConsignmentOptions = (id: number, search = "", productSearch = "") => request<ConsignmentOptions>(`/admin/grocery-merchants/${id}/consignment-options?vendor_search=${encodeURIComponent(search)}&product_search=${encodeURIComponent(productSearch)}`);
export const listConsignmentSources = (id: number, productSearch = "") => request<ConsignmentSourceRow[]>(`/admin/grocery-merchants/${id}/consignment-sources?product_search=${encodeURIComponent(productSearch)}`);
export const saveConsignmentSource = (source: ConsignmentSource) => request<ConsignmentSource>(`/admin/grocery-merchants/${source.store_merchant_id}/consignment-sources`, "PUT", source);
export const listConsignmentVendors = (id: number) => request<ConsignmentVendor[]>(`/admin/grocery-merchants/${id}/consignment-vendors`);
export const recordConsignmentPayout = (id: number, vendorId: number, amount_cents: number, reference: string) => request<null>(`/admin/grocery-merchants/${id}/consignment-vendors/${vendorId}/payouts`, "POST", { amount_cents, reference });
