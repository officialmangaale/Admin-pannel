"use client";

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

const USER_API_BASE_URL =
  process.env.NEXT_PUBLIC_USER_API_BASE_URL || "https://user-prod.mangaale.com";

export interface LookupPagination {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
}

export interface RestaurantLookupOption {
  id: number;
  uuid?: string | null;
  name: string;
  owner_name?: string | null;
  city?: string | null;
  status?: string | null;
  outlet_code?: string | null;
  owner_auth_user_id?: number | null;
  label: string;
}

export interface UserLookupOption {
  id: string;
  uuid: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  type?: string | null;
  status?: string | null;
  business_name?: string | null;
  label: string;
}

interface LookupResponse<T> {
  success?: boolean;
  data?: T[];
  pagination?: LookupPagination;
}

const authHeaders = (): Headers => {
  const headers = new Headers();
  const token = typeof window === "undefined" ? null : localStorage.getItem("auth_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
};

async function requestLookup<T>(baseUrl: string, path: string): Promise<LookupResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.message || `Lookup failed (${response.status})`;
    throw new Error(message);
  }
  return parsed as LookupResponse<T>;
}

export const searchRestaurants = async ({
  query,
  page = 1,
  limit = 20,
  status,
}: {
  query: string;
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  return requestLookup<RestaurantLookupOption>(RESTAURANT_API_BASE_URL, `/admin/lookups/restaurants?${params.toString()}`);
};

export const searchUsers = async ({
  query,
  page = 1,
  limit = 20,
  type,
  status,
}: {
  query: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) => {
  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  });
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  return requestLookup<UserLookupOption>(USER_API_BASE_URL, `/admin/lookups/users?${params.toString()}`);
};
