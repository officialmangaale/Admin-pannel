"use client";

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

export type PosAppAssetType =
  | "SPLASH_IMAGE"
  | "SPLASH_IMAGE_2"
  | "SPLASH_IMAGE_3"
  | "SPLASH_IMAGE_4"
  | "ENTRY_IMAGE"
  | "HOME_BG_IMAGE";

export interface PosAppAsset {
  id: number;
  restaurant_id?: number | null;
  asset_type: PosAppAssetType;
  image_url: string;
  image_width?: number | null;
  image_height?: number | null;
  file_size_bytes?: number | null;
  is_active: boolean;
  uploaded_by_admin_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PosAppAssetsResponse {
  splash_image_url?: string;
  splash_image_urls?: string[];
  entry_image_url?: string;
  home_bg_image_url?: string;
  fetched_at?: string;
  assets?: PosAppAsset[];
}

export interface PosAppAssetUploadResponse {
  url: string;
  width: number;
  height: number;
  size_bytes: number;
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
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
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
      parsed?.error?.message || parsed?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return (parsed?.data ?? parsed) as T;
}

export const posAppAssetsService = {
  get: (restaurantId: number | null): Promise<PosAppAssetsResponse> => {
    const query = restaurantId === null ? "global" : restaurantId.toString();
    return request<PosAppAssetsResponse>(
      `/api/v1/admin/pos/app-assets?restaurant_id=${encodeURIComponent(query)}`
    );
  },

  upload: async (file: File): Promise<PosAppAssetUploadResponse> => {
    const form = new FormData();
    form.append("file", file);
    return request<PosAppAssetUploadResponse>(
      "/api/v1/admin/pos/app-assets/upload",
      {
        method: "POST",
        body: form,
      }
    );
  },

  save: (input: {
    restaurant_id: number | null;
    asset_type: PosAppAssetType;
    image_url: string;
    image_width: number;
    image_height: number;
    file_size_bytes: number;
  }): Promise<{ asset: PosAppAsset }> => {
    return request<{ asset: PosAppAsset }>("/api/v1/admin/pos/app-assets", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  remove: (assetId: number): Promise<{ asset: PosAppAsset }> => {
    return request<{ asset: PosAppAsset }>(
      `/api/v1/admin/pos/app-assets/${assetId}`,
      { method: "DELETE" }
    );
  },
};
