"use client";
import type { HomeLayout } from "./customerHomeContract";
const origin =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";
export interface HomeDraft {
  id: number;
  version: number;
  payload: HomeLayout;
  updated_at: string;
}
export interface HomeRelease {
  revision: number;
  render_mode: "builtin" | "configured";
  audience: string[];
  actor: string;
  reason: string;
  created_at: string;
  payload?: HomeLayout;
}
export interface HomeHistory {
  active_revision: number;
  releases: HomeRelease[];
}
export interface HomeCapabilities {
  schema_version: number;
  renderer_version: number;
  approved_image_hosts: string[];
  enabled: boolean;
  max_bytes: number;
}
export interface PublishHome {
  expected_revision: number;
  draft_id?: number;
  draft_version?: number;
  rollback_revision?: number;
  audience?: string[];
  reason: string;
}
async function request<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const headers = new Headers();
  const token = localStorage.getItem("auth_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const form = body instanceof FormData;
  if (body !== undefined && !form)
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${origin}/admin/customer-home${path}`, {
    method,
    headers,
    cache: "no-store",
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw Error(
      response.status === 409
        ? "Concurrency conflict: reload and review the current draft and release before trying again."
        : result?.error?.message || result?.message || "Customer-home request failed",
    );
  return result.data as T;
}
export const customerHomeApi = {
  capabilities: () => request<HomeCapabilities>("/capabilities"),
  drafts: () => request<HomeDraft[]>("/drafts"),
  history: () => request<HomeHistory>("/history"),
  preview: (id: number) => request<HomeDraft>(`/drafts/${id}/preview`),
  save: (payload: HomeLayout, draft?: HomeDraft) =>
    request<HomeDraft>(
      draft ? `/drafts/${draft.id}` : "/drafts",
      { payload, version: draft?.version ?? 0 },
      draft ? "PUT" : "POST",
    ),
  validate: (payload: HomeLayout) =>
    request<{
      valid: boolean;
    }>("/validate", payload),
  publish: (body: PublishHome) =>
    request<{
      revision: number;
    }>("/publish", body),
  rollback: (body: PublishHome) =>
    request<{
      revision: number;
    }>("/rollback", body),
  builtin: (body: PublishHome) =>
    request<{
      revision: number;
    }>("/builtin", body),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{
      url: string;
    }>("/assets", form);
  },
};
