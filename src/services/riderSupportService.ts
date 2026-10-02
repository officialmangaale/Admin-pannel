"use client";

// Rider support tickets (rider-service /api/v1/admin/support-tickets).
// Riders raise these from the rider app; operations read and resolve them here.

const RIDER_API_BASE_URL =
  process.env.NEXT_PUBLIC_RIDER_API_BASE_URL || "https://rider-prod.mangaale.com";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface RiderSupportTicket {
  id: number;
  category: "delivery" | "payout" | "account" | "safety" | "other";
  subject: string;
  description: string;
  order_id?: number | null;
  status: TicketStatus;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  rider_id: string;
  rider_name: string;
  rider_phone: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("auth_token");
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${RIDER_API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const text = await response.text();
  let parsed: { data?: unknown; message?: string; error?: string } = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON body: fall through to the status message below.
  }
  if (!response.ok) {
    throw new Error(parsed?.message || `Request failed (${response.status})`);
  }
  return (parsed?.data ?? parsed) as T;
}

export const listRiderSupportTickets = (status?: TicketStatus, limit = 50, offset = 0) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) params.set("status", status);
  return request<{ tickets: RiderSupportTicket[] }>(`/api/v1/admin/support-tickets?${params.toString()}`);
};

export const updateRiderSupportTicket = (id: number, status: TicketStatus, adminNote?: string) =>
  request<{ id: number; status: TicketStatus }>(`/api/v1/admin/support-tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(adminNote !== undefined ? { admin_note: adminNote } : {}) }),
  });
