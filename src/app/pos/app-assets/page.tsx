"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Images, Loader2, RefreshCw } from "lucide-react";
import AppAssetCard from "@/components/pos/AppAssetCard";
import Toast from "@/components/Toast";
import { restaurantApi, type Restaurant } from "@/lib/api";
import { useToast } from "@/lib/useToast";
import {
  posAppAssetsService,
  type PosAppAsset,
  type PosAppAssetType,
  type PosAppAssetsResponse,
} from "@/services/posAppAssetsService";

const assetCards: Array<{
  type: PosAppAssetType;
  title: string;
  recommended: string;
}> = [
  {
    type: "SPLASH_IMAGE",
    title: "Splash Screen Image",
    recommended: "1080x1920px",
  },
  {
    type: "ENTRY_IMAGE",
    title: "Entry / Welcome Screen Image",
    recommended: "1080x1920px",
  },
  {
    type: "HOME_BG_IMAGE",
    title: "Home Screen Top Background Image",
    recommended: "1600x700px",
  },
];

export default function PosAppAssetsPage() {
  const { toast, showToast, hideToast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("global");
  const [assets, setAssets] = useState<PosAppAssetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<PosAppAssetType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRestaurantId =
    selectedRestaurant === "global" ? null : Number(selectedRestaurant);

  const assetsByType = useMemo(() => {
    const map = new Map<PosAppAssetType, PosAppAsset>();
    for (const asset of assets?.assets ?? []) {
      map.set(asset.asset_type, asset);
    }
    return map;
  }, [assets]);

  const loadRestaurants = async () => {
    try {
      const response = await restaurantApi.getAll({ page: 1, limit: 200 });
      setRestaurants(response.data.items || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load restaurants", "error");
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await posAppAssetsService.get(selectedRestaurantId);
      setAssets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load POS app assets";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [selectedRestaurant]);

  const validateFile = (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return "Only jpg, png, or webp images are allowed.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be 5MB or smaller.";
    }
    return null;
  };

  const handleUpload = async (assetType: PosAppAssetType, file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      showToast(validationError, "warning");
      return;
    }

    setSavingType(assetType);
    try {
      const uploaded = await posAppAssetsService.upload(file);
      await posAppAssetsService.save({
        restaurant_id: selectedRestaurantId,
        asset_type: assetType,
        image_url: uploaded.url,
        image_width: uploaded.width,
        image_height: uploaded.height,
        file_size_bytes: uploaded.size_bytes,
      });
      showToast("POS app asset updated", "success");
      await loadAssets();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setSavingType(null);
    }
  };

  const handleRemove = async (asset: PosAppAsset) => {
    setSavingType(asset.asset_type);
    try {
      await posAppAssetsService.remove(asset.id);
      showToast("POS app asset removed", "success");
      await loadAssets();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Remove failed", "error");
    } finally {
      setSavingType(null);
    }
  };

  const canRemove = (asset?: PosAppAsset) => {
    if (!asset) return false;
    if (selectedRestaurantId === null) return asset.restaurant_id == null;
    return asset.restaurant_id === selectedRestaurantId;
  };

  return (
    <div className="space-y-6 pb-10">
      <Toast toast={toast} onClose={hideToast} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
            <Images size={18} />
            POS App Branding
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            POS App Branding
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage launch, entry, and home screen imagery.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAssets}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Restaurant
        </label>
        <select
          value={selectedRestaurant}
          onChange={(event) => setSelectedRestaurant(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="global">Global Default</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name} #{restaurant.id}
            </option>
          ))}
        </select>
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-slate-500">
          <Loader2 className="mr-2 animate-spin" size={20} />
          Loading POS app assets
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
          <AlertCircle size={20} />
          <div>
            <p className="text-sm font-bold">Failed to load assets</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          {assetCards.map((card) => {
            const asset = assetsByType.get(card.type);
            return (
              <AppAssetCard
                key={card.type}
                title={card.title}
                assetType={card.type}
                asset={asset}
                recommended={card.recommended}
                canRemove={canRemove(asset)}
                busy={savingType === card.type}
                onUpload={handleUpload}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      )}

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-sm font-medium text-blue-900">
        Changes take effect in the POS app within 1 hour, or immediately after
        the app is restarted.
      </section>
    </div>
  );
}
