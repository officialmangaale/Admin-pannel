"use client";

// Admin promotional push campaigns: send a product notification to customers
// and see how many orders it led to. Backend: restaurant-service
// /admin/push-campaigns (needs the admin_promotions_manage permission).

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type PushItemType = "grocery" | "food";
export type PushAudienceType = "all_customers" | "user_ids";

export interface PushCampaign {
  id: number;
  title: string;
  body: string;
  item_type: PushItemType;
  product_id: number;
  audience_type: PushAudienceType;
  status: "sending" | "sent" | "failed";
  recipients_total: number;
  sent_count: number;
  skipped_count: number;
  last_error?: string;
  created_by: string;
  created_at: string;
  finished_at?: string | null;
}

export interface PushCampaignStats extends PushCampaign {
  attributed_orders: number;
  attributed_revenue: number;
}

export interface PushCampaignInput {
  title: string;
  body: string;
  item_type: PushItemType;
  product_id: number;
  audience_type: PushAudienceType;
  user_ids?: string[];
  confirm_all_customers?: boolean;
  dry_run?: boolean;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("auth_token");
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${RESTAURANT_API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const text = await response.text();
  let parsed: { data?: unknown; message?: string; error?: { message?: string } } = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON error page: fall through to the status message below.
  }
  if (!response.ok) {
    throw new Error(parsed?.error?.message || parsed?.message || `Request failed (${response.status})`);
  }
  return (parsed?.data ?? parsed) as T;
}

/** Validates the campaign and returns how many customers it would reach. */
export const previewPushAudience = (input: PushCampaignInput) =>
  request<{ audience_size: number }>("/admin/push-campaigns", {
    method: "POST",
    body: JSON.stringify({ ...input, dry_run: true }),
  });

/** Starts sending in the background; poll getPushCampaign for progress. */
export const createPushCampaign = (input: PushCampaignInput) =>
  request<PushCampaign>("/admin/push-campaigns", {
    method: "POST",
    body: JSON.stringify({ ...input, dry_run: false }),
  });

export const listPushCampaigns = (limit = 25, offset = 0) =>
  request<{ campaigns: PushCampaign[] }>(`/admin/push-campaigns?limit=${limit}&offset=${offset}`);

export const getPushCampaign = (id: number) => request<PushCampaignStats>(`/admin/push-campaigns/${id}`);
