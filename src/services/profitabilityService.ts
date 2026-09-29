"use client";

// Profitability analytics API client (platform upgrade Module 9).

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type ProfitabilityDimension =
  | "restaurant"
  | "rider"
  | "day"
  | "week"
  | "month"
  | "location";

export interface ProfitabilityRow {
  group_key: string;
  group_label: string;
  order_count: number;
  restaurant_commission_revenue: number;
  customer_markup_revenue: number;
  platform_fee_revenue: number;
  delivery_fee_revenue: number;
  other_platform_revenue: number;
  rider_cost: number;
  coupon_subsidy: number;
  promotional_subsidy: number;
  refund_cost: number;
  other_costs: number;
  platform_revenue: number;
  platform_costs: number;
  net_profit_loss: number;
}

export interface OrderProfitability {
  order_id: number;
  restaurant_id: number;
  order_type: string;
  created_at: string;
  restaurant_commission_revenue: number;
  customer_markup_revenue: number;
  platform_fee_revenue: number;
  delivery_fee_revenue: number;
  rider_cost: number;
  coupon_subsidy: number;
  promotional_subsidy: number;
  refund_cost: number;
  customer_final_payable: number;
  restaurant_settlement: number;
  platform_revenue: number;
  estimated_platform_profit: number;
}

// Full itemized breakdown (platform upgrade Module 13) — the same
// order_pricing_snapshots row OrderProfitability above condenses into a
// handful of summary fields, returned here in full.
export interface ResolvedFee {
  name: string;
  amount: number;
  taxable?: boolean;
  visible?: boolean;
}

export interface AppliedPricingRule {
  rule_type: string;
  rule_id?: string;
  [key: string]: unknown;
}

export interface PricingBreakdownDetail {
  base_item_total: number;
  customer_item_total: number;
  markup_amount: number;

  tax_amount: number;
  cgst: number;
  sgst: number;

  packaging_fee: number;
  delivery_fee: number;
  platform_fee: number;
  additional_charges: number;
  tip_amount: number;

  applied_fees?: ResolvedFee[];
  dynamic_fees_total: number;

  coupon_discount: number;
  coupon_funding_source: string;
  coupon_platform_funded: number;
  coupon_restaurant_funded: number;
  referral_discount: number;

  exact_payable: number;
  round_off_amount: number;
  final_payable: number;

  restaurant_base_revenue: number;
  restaurant_commission_rate_percent: number;
  restaurant_commission: number;
  restaurant_adjustment: number;
  restaurant_settlement: number;

  rider_earning: number;
  rider_cost: number;
  cash_collected: number;
  rider_wallet_adjustment: number;
  rider_payable: number;
  platform_receivable_from_rider: number;

  platform_revenue: number;
  platform_costs: number;
  estimated_platform_profit: number;

  applied_rules?: AppliedPricingRule[];
}

export interface OrderFinancialBreakdown {
  id: number;
  order_id: number;
  restaurant_id: number;
  order_type: string;
  final_payable: number;
  restaurant_commission: number;
  restaurant_settlement: number;
  rider_cost: number;
  platform_revenue: number;
  estimated_platform_profit: number;
  coupon_funding_source: string;
  breakdown: PricingBreakdownDetail;
  engine_version: number;
  created_at: string;
  created_by: string;
}

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

async function request<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${RESTAURANT_API_BASE_URL}${path}`, {
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

export const getProfitabilityRollup = (params: {
  dimension: ProfitabilityDimension;
  restaurantId?: number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const qs = new URLSearchParams({ dimension: params.dimension });
  if (params.restaurantId) qs.set("restaurant_id", String(params.restaurantId));
  if (params.dateFrom) qs.set("date_from", params.dateFrom);
  if (params.dateTo) qs.set("date_to", params.dateTo);
  return request<ProfitabilityRow[]>(`/admin/profitability/rollup?${qs.toString()}`);
};

export const getOrderProfitability = (orderId: number) =>
  request<OrderProfitability>(`/admin/orders/${orderId}/profitability`);

export const getOrderFinancialBreakdown = (orderId: number) =>
  request<OrderFinancialBreakdown>(`/admin/orders/${orderId}/financial-breakdown`);
