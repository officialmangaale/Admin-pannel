"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import {
    DynamicFeeRule,
    DynamicFeeRuleInput,
    FeeRuleType,
    createFeeRule,
    deleteFeeRule,
    listFeeRules,
    updateFeeRule,
} from "@/services/feeRuleService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const emptyRule: DynamicFeeRuleInput = {
    fee_code: "",
    fee_name: "",
    customer_title: "",
    description: "",
    rule_type: "fixed",
    rate_permille: 0,
    fixed_amount_cents: 0,
    is_taxable: true,
    is_customer_visible: true,
    is_active: true,
    priority: 0,
};

/**
 * Platform Fee and Additional Charges (platform upgrade Module 5).
 *
 * Fees are additive — unlike delivery/commission/markup rules, more than
 * one can apply to the same order at once (platform fee + handling fee +
 * night fee, all simultaneously). Within one fee code, a restaurant-specific
 * rule overrides the global one for that restaurant. The customer_title is
 * what the app renders — nothing about fee names is hardcoded client-side.
 *
 * Not wired into live checkout yet — see
 * restaurant-service/services/fee_pricing.go for why.
 */
export default function FeeRulesPage() {
    const { toast, showToast, hideToast } = useToast();
    const [restaurantId, setRestaurantId] = useState<string>("");

    const [rules, setRules] = useState<DynamicFeeRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<number | "new" | null>(null);
    const [newRule, setNewRule] = useState<DynamicFeeRuleInput>(emptyRule);

    const scopedRestaurantId = restaurantId.trim() ? Number(restaurantId.trim()) : undefined;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRules(await listFeeRules(scopedRestaurantId, true));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load fee rules");
        } finally {
            setLoading(false);
        }
         
    }, [scopedRestaurantId]);

    useEffect(() => {
        void load();
    }, [load]);

    const create = async () => {
        if (!newRule.fee_code.trim() || !newRule.fee_name.trim() || !newRule.customer_title.trim()) {
            showToast("Fee code, name, and customer title are required", "error");
            return;
        }
        setSaving("new");
        try {
            await createFeeRule({ ...newRule, restaurant_id: scopedRestaurantId ?? null });
            setNewRule(emptyRule);
            showToast("Fee rule created", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not create the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    const save = async (rule: DynamicFeeRule, input: DynamicFeeRuleInput) => {
        setSaving(rule.id);
        try {
            await updateFeeRule(rule.id, { ...input, restaurant_id: rule.restaurant_id ?? null, category_id: rule.category_id ?? null });
            showToast("Fee rule updated", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    const remove = async (rule: DynamicFeeRule) => {
        if (!confirm(`Delete the "${rule.fee_name}" rule?`)) return;
        setSaving(rule.id);
        try {
            await deleteFeeRule(rule.id);
            showToast("Fee rule deleted", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not delete the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <Toast toast={toast} onClose={hideToast} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Fee Rules</h1>
                    <p className="text-sm text-gray-500">
                        Platform fee, handling fee, night fee, or any custom charge. Fees are
                        additive — several can apply to the same order at once.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
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

            <div className="rounded-lg border p-4 space-y-3">
                <h2 className="font-medium">Add a fee</h2>
                {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Internal code">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="platform_fee"
                            value={newRule.fee_code}
                            onChange={(e) => setNewRule({ ...newRule, fee_code: e.target.value })}
                        />
                    </Field>
                    <Field label="Internal name">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="Platform Fee"
                            value={newRule.fee_name}
                            onChange={(e) => setNewRule({ ...newRule, fee_name: e.target.value })}
                        />
                    </Field>
                    <Field label="Customer-visible title">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="Platform Fee"
                            value={newRule.customer_title}
                            onChange={(e) => setNewRule({ ...newRule, customer_title: e.target.value })}
                        />
                    </Field>
                    <Field label="Description">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.description ?? ""}
                            onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                        />
                    </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-7 items-end">
                    <Field label="Type">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.rule_type}
                            onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as FeeRuleType })}
                        >
                            <option value="fixed">Fixed</option>
                            <option value="percentage">Percentage</option>
                        </select>
                    </Field>
                    {newRule.rule_type === "percentage" ? (
                        <Field label="Rate (%)">
                            <input
                                type="number"
                                step="0.1"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={newRule.rate_permille / 10}
                                onChange={(e) => setNewRule({ ...newRule, rate_permille: Math.round(Number(e.target.value) * 10) })}
                            />
                        </Field>
                    ) : (
                        <Field label="Fixed (₹)">
                            <input
                                type="number"
                                step="0.01"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={newRule.fixed_amount_cents / 100}
                                onChange={(e) => setNewRule({ ...newRule, fixed_amount_cents: Math.round(Number(e.target.value) * 100) })}
                            />
                        </Field>
                    )}
                    <Field label="Min order ₹">
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.min_order_value ?? ""}
                            onChange={(e) =>
                                setNewRule({ ...newRule, min_order_value: e.target.value === "" ? null : Number(e.target.value) })
                            }
                        />
                    </Field>
                    <Field label="Max order ₹">
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.max_order_value ?? ""}
                            onChange={(e) =>
                                setNewRule({ ...newRule, max_order_value: e.target.value === "" ? null : Number(e.target.value) })
                            }
                        />
                    </Field>
                    <Field label="Start time">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="22:00"
                            value={newRule.start_time ?? ""}
                            onChange={(e) => setNewRule({ ...newRule, start_time: e.target.value || null })}
                        />
                    </Field>
                    <Field label="End time">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="06:00"
                            value={newRule.end_time ?? ""}
                            onChange={(e) => setNewRule({ ...newRule, end_time: e.target.value || null })}
                        />
                    </Field>
                    <button
                        onClick={() => void create()}
                        disabled={saving === "new"}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                    </button>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={newRule.is_taxable ?? true}
                            onChange={(e) => setNewRule({ ...newRule, is_taxable: e.target.checked })}
                        />
                        Taxable
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={newRule.is_customer_visible ?? true}
                            onChange={(e) => setNewRule({ ...newRule, is_customer_visible: e.target.checked })}
                        />
                        Customer visible
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={newRule.is_active ?? true}
                            onChange={(e) => setNewRule({ ...newRule, is_active: e.target.checked })}
                        />
                        Active
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
                </div>
            ) : rules.length === 0 ? (
                <p className="text-sm text-gray-500">No fee rules for this scope yet. Add the first one above.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2">Code / Title</th>
                                <th className="px-3 py-2">Value</th>
                                <th className="px-3 py-2">Window</th>
                                <th className="px-3 py-2">Taxable</th>
                                <th className="px-3 py-2">Visible</th>
                                <th className="px-3 py-2">Active</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((rule) => (
                                <RuleRow
                                    key={rule.id}
                                    rule={rule}
                                    saving={saving === rule.id}
                                    onSave={(input) => void save(rule, input)}
                                    onDelete={() => void remove(rule)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
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
    rule: DynamicFeeRule;
    saving: boolean;
    onSave: (input: DynamicFeeRuleInput) => void;
    onDelete: () => void;
}) {
    const [ruleType, setRuleType] = useState<FeeRuleType>(rule.rule_type);
    const [ratePercent, setRatePercent] = useState(rule.rate_permille / 10);
    const [fixedRupees, setFixedRupees] = useState(rule.fixed_amount_cents / 100);
    const [startTime, setStartTime] = useState(rule.start_time ?? "");
    const [endTime, setEndTime] = useState(rule.end_time ?? "");
    const [isTaxable, setIsTaxable] = useState(rule.is_taxable);
    const [isVisible, setIsVisible] = useState(rule.is_customer_visible);
    const [isActive, setIsActive] = useState(rule.is_active);

    return (
        <tr className="border-t align-top">
            <td className="px-3 py-2">
                <div className="font-medium">{rule.customer_title}</div>
                <div className="text-xs text-gray-500">
                    {rule.fee_code} {rule.restaurant_id ? `· restaurant ${rule.restaurant_id}` : "· global"}
                </div>
            </td>
            <td className="px-3 py-2">
                <select
                    className="mr-2 rounded border px-2 py-1"
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as FeeRuleType)}
                >
                    <option value="fixed">₹</option>
                    <option value="percentage">%</option>
                </select>
                {ruleType === "percentage" ? (
                    <input
                        type="number"
                        step="0.1"
                        className="w-20 rounded border px-2 py-1"
                        value={ratePercent}
                        onChange={(e) => setRatePercent(Number(e.target.value))}
                    />
                ) : (
                    <input
                        type="number"
                        step="0.01"
                        className="w-20 rounded border px-2 py-1"
                        value={fixedRupees}
                        onChange={(e) => setFixedRupees(Number(e.target.value))}
                    />
                )}
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
                <input
                    className="w-16 rounded border px-2 py-1"
                    placeholder="start"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
                {" – "}
                <input
                    className="w-16 rounded border px-2 py-1"
                    placeholder="end"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                />
            </td>
            <td className="px-3 py-2">
                <input type="checkbox" checked={isTaxable} onChange={(e) => setIsTaxable(e.target.checked)} />
            </td>
            <td className="px-3 py-2">
                <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
            </td>
            <td className="px-3 py-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            </td>
            <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button
                    onClick={() =>
                        onSave({
                            fee_code: rule.fee_code,
                            fee_name: rule.fee_name,
                            customer_title: rule.customer_title,
                            description: rule.description,
                            rule_type: ruleType,
                            rate_permille: Math.round(ratePercent * 10),
                            fixed_amount_cents: Math.round(fixedRupees * 100),
                            min_order_value: rule.min_order_value,
                            max_order_value: rule.max_order_value,
                            start_time: startTime || null,
                            end_time: endTime || null,
                            is_taxable: isTaxable,
                            is_customer_visible: isVisible,
                            is_active: isActive,
                            priority: rule.priority,
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
