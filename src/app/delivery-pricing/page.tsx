"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import {
    DeliveryPricingRule,
    DeliveryPricingRuleInput,
    DeliveryPricingSettings,
    createDeliveryPricingRule,
    deleteDeliveryPricingRule,
    getDeliveryPricingSettings,
    listDeliveryPricingRules,
    saveDeliveryPricingSettings,
    updateDeliveryPricingRule,
} from "@/services/deliveryPricingService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

/**
 * Dynamic Delivery Charge Management (platform upgrade Module 2).
 *
 * Manages distance slabs and the settings that govern max delivery
 * distance, free delivery, and night/peak/surge/rain surcharges — for
 * either the platform default (no restaurant selected) or one restaurant's
 * override.
 *
 * Note: nothing here affects live checkout yet. The backend resolver exists
 * and this screen configures it, but the actual customer-facing delivery
 * fee calculation is still client-supplied until that's wired in as a
 * deliberate follow-up (see restaurant-service/services/delivery_pricing.go).
 */
export default function DeliveryPricingPage() {
    const { toast, showToast, hideToast } = useToast();
    const [restaurantId, setRestaurantId] = useState<string>("");

    const [rules, setRules] = useState<DeliveryPricingRule[]>([]);
    const [rulesLoading, setRulesLoading] = useState(true);
    const [rulesError, setRulesError] = useState<string | null>(null);
    const [savingRule, setSavingRule] = useState<number | "new" | null>(null);
    const [newRule, setNewRule] = useState<DeliveryPricingRuleInput>({
        min_distance_km: 0,
        max_distance_km: 0,
        fee_amount: 0,
        is_active: true,
        priority: 0,
    });

    const [settings, setSettings] = useState<DeliveryPricingSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    const scopedRestaurantId = restaurantId.trim() ? Number(restaurantId.trim()) : undefined;

    const loadRules = useCallback(async () => {
        setRulesLoading(true);
        setRulesError(null);
        try {
            const data = await listDeliveryPricingRules(scopedRestaurantId, true);
            setRules(data ?? []);
        } catch (err) {
            setRulesError(err instanceof Error ? err.message : "Could not load delivery pricing rules");
        } finally {
            setRulesLoading(false);
        }
         
    }, [scopedRestaurantId]);

    const loadSettings = useCallback(async () => {
        setSettingsLoading(true);
        setSettingsError(null);
        try {
            setSettings(await getDeliveryPricingSettings(scopedRestaurantId));
        } catch (err) {
            setSettingsError(err instanceof Error ? err.message : "Could not load delivery pricing settings");
        } finally {
            setSettingsLoading(false);
        }
         
    }, [scopedRestaurantId]);

    useEffect(() => {
        void loadRules();
        void loadSettings();
    }, [loadRules, loadSettings]);

    const createRule = async () => {
        if (newRule.max_distance_km <= newRule.min_distance_km) {
            showToast("Max distance must be greater than min distance", "error");
            return;
        }
        setSavingRule("new");
        try {
            await createDeliveryPricingRule({ ...newRule, restaurant_id: scopedRestaurantId ?? null });
            setNewRule({ min_distance_km: 0, max_distance_km: 0, fee_amount: 0, is_active: true, priority: 0 });
            showToast("Delivery pricing rule created", "success");
            await loadRules();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not create the rule", "error");
        } finally {
            setSavingRule(null);
        }
    };

    const saveRule = async (rule: DeliveryPricingRule, input: DeliveryPricingRuleInput) => {
        setSavingRule(rule.id);
        try {
            await updateDeliveryPricingRule(rule.id, { ...input, restaurant_id: rule.restaurant_id ?? null });
            showToast("Delivery pricing rule updated", "success");
            await loadRules();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save the rule", "error");
        } finally {
            setSavingRule(null);
        }
    };

    const removeRule = async (rule: DeliveryPricingRule) => {
        if (!confirm(`Delete the ${rule.min_distance_km}-${rule.max_distance_km} km slab?`)) return;
        setSavingRule(rule.id);
        try {
            await deleteDeliveryPricingRule(rule.id);
            showToast("Delivery pricing rule deleted", "success");
            await loadRules();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not delete the rule", "error");
        } finally {
            setSavingRule(null);
        }
    };

    const saveSettings = async () => {
        if (!settings) return;
        setSettingsSaving(true);
        try {
            const saved = await saveDeliveryPricingSettings({
                ...settings,
                restaurant_id: scopedRestaurantId ?? null,
            });
            setSettings(saved);
            showToast("Delivery pricing settings saved", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save settings", "error");
        } finally {
            setSettingsSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <Toast toast={toast} onClose={hideToast} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Delivery Pricing</h1>
                    <p className="text-sm text-gray-500">
                        Distance-based delivery fee slabs and surcharge settings. Leave the
                        restaurant field empty to manage the platform-wide default; a
                        restaurant with its own rules overrides the default entirely.
                    </p>
                </div>
                <button
                    onClick={() => {
                        void loadRules();
                        void loadSettings();
                    }}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="rounded-lg border p-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Restaurant ID (optional)</label>
                <input
                    className="w-40 rounded-md border px-3 py-2 text-sm"
                    placeholder="Global default"
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <span className="text-xs text-gray-500">
                    {scopedRestaurantId ? `Editing restaurant ${scopedRestaurantId}'s own rules` : "Editing the global default"}
                </span>
            </div>

            {/* ── Settings ── */}
            <div className="rounded-lg border p-4 space-y-4">
                <h2 className="font-medium">Settings</h2>
                {settingsError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {settingsError}
                    </div>
                )}
                {settingsLoading || !settings ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Field label="Max delivery distance (km)">
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={settings.max_delivery_distance_km}
                                    onChange={(e) =>
                                        setSettings({ ...settings, max_delivery_distance_km: Number(e.target.value) })
                                    }
                                />
                            </Field>
                            <Field label="Free delivery above cart value (₹, blank = disabled)">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={settings.free_delivery_min_cart_value ?? ""}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            free_delivery_min_cart_value: e.target.value === "" ? null : Number(e.target.value),
                                        })
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <Field label="Night charge (₹)">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={settings.night_charge_amount}
                                    onChange={(e) => setSettings({ ...settings, night_charge_amount: Number(e.target.value) })}
                                />
                            </Field>
                            <Field label="Night start (HH:MM)">
                                <input
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="22:00"
                                    value={settings.night_start_time ?? ""}
                                    onChange={(e) => setSettings({ ...settings, night_start_time: e.target.value || null })}
                                />
                            </Field>
                            <Field label="Night end (HH:MM)">
                                <input
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="06:00"
                                    value={settings.night_end_time ?? ""}
                                    onChange={(e) => setSettings({ ...settings, night_end_time: e.target.value || null })}
                                />
                            </Field>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <Field label="Peak-hour charge (₹)">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={settings.peak_hour_charge_amount}
                                    onChange={(e) =>
                                        setSettings({ ...settings, peak_hour_charge_amount: Number(e.target.value) })
                                    }
                                />
                            </Field>
                            <Field label="Peak start (HH:MM)">
                                <input
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="12:30"
                                    value={settings.peak_start_time ?? ""}
                                    onChange={(e) => setSettings({ ...settings, peak_start_time: e.target.value || null })}
                                />
                            </Field>
                            <Field label="Peak end (HH:MM)">
                                <input
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="14:30"
                                    value={settings.peak_end_time ?? ""}
                                    onChange={(e) => setSettings({ ...settings, peak_end_time: e.target.value || null })}
                                />
                            </Field>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.surge_enabled}
                                    onChange={(e) => setSettings({ ...settings, surge_enabled: e.target.checked })}
                                />
                                Surge active now
                            </label>
                            <Field label="Surge charge (₹)">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={settings.surge_charge_amount}
                                    onChange={(e) => setSettings({ ...settings, surge_charge_amount: Number(e.target.value) })}
                                />
                            </Field>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.rain_enabled}
                                    onChange={(e) => setSettings({ ...settings, rain_enabled: e.target.checked })}
                                />
                                Rain mode active now
                            </label>
                            <Field label="Rain charge (₹)">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={settings.rain_charge_amount}
                                    onChange={(e) => setSettings({ ...settings, rain_charge_amount: Number(e.target.value) })}
                                />
                            </Field>
                        </div>

                        <p className="text-xs text-gray-500">
                            Surge and rain are manual toggles — there is no automatic weather or
                            traffic detection in this platform yet.
                        </p>

                        <button
                            onClick={() => void saveSettings()}
                            disabled={settingsSaving}
                            className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                            {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save settings
                        </button>
                    </div>
                )}
            </div>

            {/* ── Distance slabs ── */}
            <div className="rounded-lg border p-4 space-y-3">
                <h2 className="font-medium">Distance slabs</h2>
                {rulesError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {rulesError}
                    </div>
                )}

                <div className="grid gap-3 md:grid-cols-6 items-end">
                    <Field label="Min km">
                        <input
                            type="number"
                            step="0.1"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.min_distance_km}
                            onChange={(e) => setNewRule({ ...newRule, min_distance_km: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Max km">
                        <input
                            type="number"
                            step="0.1"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.max_distance_km}
                            onChange={(e) => setNewRule({ ...newRule, max_distance_km: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Fee (₹)">
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.fee_amount}
                            onChange={(e) => setNewRule({ ...newRule, fee_amount: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Priority">
                        <input
                            type="number"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.priority}
                            onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-sm pb-2">
                        <input
                            type="checkbox"
                            checked={newRule.is_active ?? true}
                            onChange={(e) => setNewRule({ ...newRule, is_active: e.target.checked })}
                        />
                        Active
                    </label>
                    <button
                        onClick={() => void createRule()}
                        disabled={savingRule === "new"}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {savingRule === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add slab
                    </button>
                </div>

                {rulesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
                    </div>
                ) : rules.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No slabs configured for this scope yet. Add the first one above — until
                        then, distance-based fee resolution for this scope has nothing to match.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-3 py-2">Min km</th>
                                    <th className="px-3 py-2">Max km</th>
                                    <th className="px-3 py-2">Fee (₹)</th>
                                    <th className="px-3 py-2">Priority</th>
                                    <th className="px-3 py-2">Active</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule) => (
                                    <RuleRow
                                        key={rule.id}
                                        rule={rule}
                                        saving={savingRule === rule.id}
                                        onSave={(input) => void saveRule(rule, input)}
                                        onDelete={() => void removeRule(rule)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">{label}</label>
            {children}
        </div>
    );
}

function RuleRow({
    rule,
    saving,
    onSave,
    onDelete,
}: {
    rule: DeliveryPricingRule;
    saving: boolean;
    onSave: (input: DeliveryPricingRuleInput) => void;
    onDelete: () => void;
}) {
    const [minKm, setMinKm] = useState(rule.min_distance_km);
    const [maxKm, setMaxKm] = useState(rule.max_distance_km);
    const [fee, setFee] = useState(rule.fee_amount);
    const [priority, setPriority] = useState(rule.priority);
    const [isActive, setIsActive] = useState(rule.is_active);

    return (
        <tr className="border-t">
            <td className="px-3 py-2">
                <input
                    type="number"
                    step="0.1"
                    className="w-20 rounded border px-2 py-1"
                    value={minKm}
                    onChange={(e) => setMinKm(Number(e.target.value))}
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    step="0.1"
                    className="w-20 rounded border px-2 py-1"
                    value={maxKm}
                    onChange={(e) => setMaxKm(Number(e.target.value))}
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    step="0.01"
                    className="w-24 rounded border px-2 py-1"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    className="w-16 rounded border px-2 py-1"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                />
            </td>
            <td className="px-3 py-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            </td>
            <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button
                    onClick={() =>
                        onSave({
                            min_distance_km: minKm,
                            max_distance_km: maxKm,
                            fee_amount: fee,
                            priority,
                            is_active: isActive,
                        })
                    }
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                </button>
                <button
                    onClick={onDelete}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-50"
                >
                    <Trash2 className="h-3 w-3" />
                    Delete
                </button>
            </td>
        </tr>
    );
}
