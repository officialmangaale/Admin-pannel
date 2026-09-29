"use client";

// Admin audit log API client (platform upgrade Module 17).

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export interface AuditLogEntry {
  id: number;
  admin_id: string;
  method: string;
  route: string;
  path_params?: Record<string, string> | null;
  request_body?: Record<string, unknown> | null;
  status_code: number;
  success: boolean;
  created_at: string;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
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

export const listAuditLogs = (params: {
  adminId?: string;
  route?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params.adminId) qs.set("admin_id", params.adminId);
  if (params.route) qs.set("route", params.route);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return request<AuditLogPage>(`/admin/audit-logs${s ? `?${s}` : ""}`);
};
