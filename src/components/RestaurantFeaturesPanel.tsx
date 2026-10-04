"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, RefreshCw, Shield, SlidersHorizontal } from "lucide-react";
import { featureApi, RestaurantFeatureSnapshot, RestaurantFeatureState } from "@/lib/api";

interface RestaurantFeaturesPanelProps {
    restaurantId: number;
}

const CATEGORY_LABELS: Record<string, string> = {
    core: "Core",
    qr: "QR",
    operations: "Operations",
    tables: "Tables",
};

export default function RestaurantFeaturesPanel({ restaurantId }: RestaurantFeaturesPanelProps) {
    const [snapshot, setSnapshot] = useState<RestaurantFeatureSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const features = useMemo(() => {
        const values = Object.values(snapshot?.features ?? {});
        return values.sort((a, b) => {
            const category = a.category.localeCompare(b.category);
            if (category !== 0) return category;
            return a.display_name.localeCompare(b.display_name);
        });
    }, [snapshot]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const next = await featureApi.getRestaurantFeatures(restaurantId);
                if (active) setSnapshot(next);
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : "Unable to load features.");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [restaurantId]);

    const toggleEntitlement = async (feature: RestaurantFeatureState) => {
        setSavingKey(feature.key);
        setError(null);
        try {
            const next = await featureApi.setRestaurantEntitlement(
                restaurantId,
                feature.key,
                !feature.entitled
            );
            setSnapshot(next);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update entitlement.");
        } finally {
            setSavingKey(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Feature Entitlements</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Restaurant ID {restaurantId}
                    </p>
                </div>
                <button
                    onClick={async () => {
                        setLoading(true);
                        setError(null);
                        try {
                            setSnapshot(await featureApi.getRestaurantFeatures(restaurantId));
                        } catch (err) {
                            setError(err instanceof Error ? err.message : "Unable to refresh features.");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {features.map((feature) => (
                    <FeatureRow
                        key={feature.key}
                        feature={feature}
                        saving={savingKey === feature.key}
                        onToggle={() => toggleEntitlement(feature)}
                    />
                ))}
            </div>
        </div>
    );
}

function FeatureRow({
    feature,
    saving,
    onToggle,
}: {
    feature: RestaurantFeatureState;
    saving: boolean;
    onToggle: () => void;
}) {
    const category = CATEGORY_LABELS[feature.category] ?? feature.category;
    const blockedBy = feature.blocked_by ?? [];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <SlidersHorizontal size={20} />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{feature.display_name}</h3>
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                {category}
                            </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{feature.description}</p>
                    </div>
                </div>
                <button
                    type="button"
                    disabled={saving}
                    onClick={onToggle}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        feature.entitled ? "bg-emerald-500" : "bg-slate-300"
                    } ${saving ? "opacity-60" : ""}`}
                    aria-label={`Toggle ${feature.display_name}`}
                >
                    <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            feature.entitled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
                    feature.entitled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                    {feature.entitled ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                    {feature.entitled ? "Entitled" : "Not entitled"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
                    feature.effective ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                }`}>
                    <Shield size={14} />
                    {feature.effective ? "Effective" : "Not effective"}
                </span>
                {!feature.restaurant_toggleable && (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                        Platform managed
                    </span>
                )}
                {blockedBy.length > 0 && (
                    <span className="rounded-lg bg-red-50 px-2.5 py-1 text-red-700">
                        Blocked by {blockedBy.join(", ")}
                    </span>
                )}
            </div>
        </div>
    );
}
