"use client";

// Rider management API client (platform upgrade Module 10/11 — rider-service).

const RIDER_API_BASE_URL =
  process.env.NEXT_PUBLIC_RIDER_API_BASE_URL || "https://rider-prod.mangaale.com";

export interface AdminRiderSummary {
  rider_id: string;
  name: string;
  phone: string;
  is_online: boolean;
  is_available: boolean;
  current_order_id?: number | null;

  completed_orders: number;
  cancelled_deliveries: number;

  total_earnings: number;
  total_incentives: number;
  total_penalties: number;

  wallet_balance: number;
  is_negative_wallet: boolean;
  cod_pending: number;
  platform_receivable: number;
  rider_payable: number;

  last_settlement_at?: string | null;
  last_settlement_status?: string;

  current_latitude?: number | null;
  current_longitude?: number | null;
  location_updated_at?: string | null;
}

export interface RiderWalletTransaction {
  id: number;
  rider_id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: number | null;
  reference_number?: string | null;
  payment_mode?: string | null;
  notes?: string | null;
  created_by_admin_id?: string | null;
  created_at: string;
}

export interface RiderSettlement {
  id: number;
  rider_id: string;
  previous_balance: number;
  settlement_amount: number;
  amount_received: number;
  amount_paid: number;
  adjustment_amount: number;
  closing_balance: number;
  payment_mode?: string | null;
  reference_number?: string | null;
  is_full_and_final: boolean;
  notes?: string | null;
  admin_id: string;
  wallet_transaction_id?: number | null;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}

export interface CreateSettlementInput {
  amount_received: number;
  amount_paid: number;
  adjustment_amount: number;
  payment_mode?: string;
  reference_number?: string;
  is_full_and_final: boolean;
  notes?: string;
}

// Directional types take a positive magnitude (server applies the sign);
// manual_adjustment and refund_reversal take a signed amount directly.
export type WalletAdjustmentType =
  | "incentive"
  | "penalty"
  | "rider_payment_to_company"
  | "company_payment_to_rider"
  | "cod_liability"
  | "manual_adjustment"
  | "refund_reversal";

export interface CreateWalletAdjustmentInput {
  transaction_type: WalletAdjustmentType;
  amount: number;
  reference_number?: string;
  notes?: string;
}

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${RIDER_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      parsed?.message || parsed?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return (parsed?.data ?? parsed) as T;
}

export const listRiders = (params: {
  search?: string;
  onlineOnly?: boolean;
  negativeWalletOnly?: boolean;
  includeLocation?: boolean;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.onlineOnly) qs.set("online_only", "true");
  if (params.negativeWalletOnly) qs.set("negative_wallet_only", "true");
  if (params.includeLocation) qs.set("include_location", "true");
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return request<Page<AdminRiderSummary>>(`/api/v1/admin/riders${s ? `?${s}` : ""}`);
};

export const getRiderWalletTransactions = (riderId: string, page = 1, limit = 20) =>
  request<Page<RiderWalletTransaction>>(
    `/api/v1/admin/riders/${riderId}/wallet/transactions?page=${page}&limit=${limit}`
  );

export const getRiderSettlements = (riderId: string, page = 1, limit = 20) =>
  request<Page<RiderSettlement>>(
    `/api/v1/admin/riders/${riderId}/settlements?page=${page}&limit=${limit}`
  );

export const createRiderSettlement = (riderId: string, input: CreateSettlementInput) =>
  request<RiderSettlement>(`/api/v1/admin/riders/${riderId}/settlements`, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const createWalletAdjustment = (riderId: string, input: CreateWalletAdjustmentInput) =>
  request<RiderWalletTransaction>(`/api/v1/admin/riders/${riderId}/wallet/adjustments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
