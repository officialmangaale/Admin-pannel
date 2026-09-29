"use client";

// Role-based admin permissions API client (platform upgrade Module 18).
// Roles/permissions/role_permissions live in restaurant-service; which
// user holds which admin tier lives in user-service (it owns the users
// table) — both against the same shared database.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

const USER_API_BASE_URL =
  process.env.NEXT_PUBLIC_USER_API_BASE_URL || "https://user-prod.mangaale.com";

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  primary_role: string;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

async function request<T>(baseUrl: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, cache: "no-store" });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = parsed?.error?.message || parsed?.error || parsed?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  // Both services wrap payloads slightly differently — unwrap whichever is present.
  return (parsed?.data?.roles ?? parsed?.data?.permissions ?? parsed?.data ?? parsed?.roles ?? parsed?.permissions ?? parsed) as T;
}

// ── Roles & Permissions (restaurant-service) ──
// Mounted at /restaurants/rbac/* — the /rbac group hangs off the existing
// /restaurants router group, not a top-level one.

export const listRoles = () => request<Role[]>(RESTAURANT_API_BASE_URL, "/restaurants/rbac/roles");

export const listPermissions = () => request<Permission[]>(RESTAURANT_API_BASE_URL, "/restaurants/rbac/permissions");

export const listRolePermissions = (roleId: number) =>
  request<Permission[]>(RESTAURANT_API_BASE_URL, `/restaurants/rbac/roles/${roleId}/permissions`);

export const assignPermission = (roleId: number, permissionId: number) =>
  request<unknown>(RESTAURANT_API_BASE_URL, `/restaurants/rbac/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permission_id: permissionId }),
  });

export const revokePermission = (roleId: number, permissionId: number) =>
  request<unknown>(RESTAURANT_API_BASE_URL, `/restaurants/rbac/roles/${roleId}/permissions/${permissionId}`, {
    method: "DELETE",
  });

export const createRole = (name: string, description: string) =>
  request<Role>(RESTAURANT_API_BASE_URL, "/restaurants/rbac/roles", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });

// ── Admin users (user-service) ──

export const listAdminUsers = (page = 1, limit = 25) =>
  request<AdminUser[]>(USER_API_BASE_URL, `/admin/users?page=${page}&limit=${limit}`);

export const updateUserRole = (userId: string, role: string) =>
  request<unknown>(USER_API_BASE_URL, `/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
