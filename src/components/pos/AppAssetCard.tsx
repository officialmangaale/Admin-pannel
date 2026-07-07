"use client";

import { ImageUp, Trash2, Loader2 } from "lucide-react";
import type {
  PosAppAsset,
  PosAppAssetType,
} from "@/services/posAppAssetsService";

interface AppAssetCardProps {
  title: string;
  assetType: PosAppAssetType;
  asset?: PosAppAsset;
  recommended: string;
  canRemove: boolean;
  busy: boolean;
  onUpload: (assetType: PosAppAssetType, file: File) => void;
  onRemove: (asset: PosAppAsset) => void;
}

export default function AppAssetCard({
  title,
  assetType,
  asset,
  recommended,
  canRemove,
  busy,
  onUpload,
  onRemove,
}: AppAssetCardProps) {
  const inputId = `asset-${assetType}`;
  const previewClassName =
    assetType === "HOME_BG_IMAGE"
      ? "aspect-[16/5]"
      : "aspect-[9/16] max-h-[420px]";
  const imageClassName =
    assetType === "HOME_BG_IMAGE"
      ? "h-full w-full object-cover"
      : "h-full w-full object-contain bg-slate-100";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Recommended: {recommended}, max 5MB
          </p>
        </div>

        <div
          className={`${previewClassName} overflow-hidden rounded-lg border border-slate-200 bg-slate-50`}
        >
          {asset?.image_url ? (
            <img
              src={asset.image_url}
              alt={title}
              className={imageClassName}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ImageUp size={40} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            Last updated:{" "}
            <span className="text-slate-700">
              {asset?.updated_at
                ? new Date(asset.updated_at).toLocaleString()
                : "Not set"}
            </span>
          </p>
          <div className="flex gap-2">
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (file) onUpload(assetType, file);
              }}
            />
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ImageUp size={16} />
              )}
              Upload
            </label>
            <button
              type="button"
              disabled={!asset || !canRemove || busy}
              onClick={() => asset && onRemove(asset)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
