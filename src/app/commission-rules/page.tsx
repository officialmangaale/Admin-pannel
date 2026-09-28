"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import {
    CommissionRule,
    CommissionRuleInput,
    CommissionRuleType,
    createCommissionRule,
    deleteCommissionRule,
    listCommissionRules,
    updateCommissionRule,
} from "@/services/commissionRuleService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const emptyRule: CommissionRuleInput = {
    rule_type: "percentage",
    rate_permille: 150,
    fixed_amount_cents: 0,
    is_active: true,
    priority: 0,
};

/**
 * Dynamic Restaurant Commission (platform upgrade Module 3).
 *
 * Global or per-restaurant commission rules: percentage or fixed, optional
 * order-value tier, priority, and an active date window. Restaurant-specific
 * rules always outrank global ones; within the same scope the highest
 * priority (then most recent) wins. Applied live in order.go's Pricing
 * Engine — every order snapshot records which rule (by id) produced its
 * commission.
 */
export default function CommissionRulesPage() {
    const { toast, showToast, hideToast } = useToast();
    const [restaurantId, setRestaurantId] = useState<string>("");

    const [rules, setRules] = useState<CommissionRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<number | "new" | null>(null);
    const [newRule, setNewRule] = useState<CommissionRuleInput>(emptyRule);

    const scopedRestaurantId = restaurantId.trim() ? Number(restaurantId.trim()) : undefined;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRules(await listCommissionRules(scopedRestaurantId, true));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load commission rules");
        } finally {
            setLoading(false);
        }
         
    }, [scopedRestaurantId]);

    useEffect(() => {
        void load();
    }, [load]);

    const create = async () => {
        if (newRule.rule_type === "percentage" && newRule.rate_permille <= 0) {
            showToast("Set a percentage rate greater than 0", "error");
            return;
        }
        if (newRule.rule_type === "fixed" && newRule.fixed_amount_cents <= 0) {
            showToast("Set a fixed amount greater than 0", "error");
            return;
        }
        setSaving("new");
        try {
            await createCommissionRule({ ...newRule, restaurant_id: scopedRestaurantId ?? null });
            setNewRule(emptyRule);
            showToast("Commission rule created", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not create the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    const save = async (rule: CommissionRule, input: CommissionRuleInput) => {
        setSaving(rule.id);
        try {
            await updateCommissionRule(rule.id, { ...input, restaurant_id: rule.restaurant_id ?? null });
            showToast("Commission rule updated", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    const remove = async (rule: CommissionRule) => {
        if (!confirm("Delete this commission rule?")) return;
        setSaving(rule.id);
        try {
            await deleteCommissionRule(rule.id);
            showToast("Commission rule deleted", "success");
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
                    <h1 className="text-2xl font-semibold">Commission Rules</h1>
                    <p className="text-sm text-gray-500">
                        Restaurant-specific rules always outrank the global default. Within
                        the same scope, the highest-priority active rule matching the
                        order value wins. Commission is always computed on the
                        restaurant&apos;s base item total, never the customer-facing markup.
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
                <h2 className="font-medium">Add a rule</h2>
                {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}
                <div className="grid gap-3 md:grid-cols-7 items-end">
                    <Field label="Type">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.rule_type}
                            onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as CommissionRuleType })}
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed</option>
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
                        onClick={() => void create()}
                        disabled={saving === "new"}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
                </div>
            ) : rules.length === 0 ? (
                <p className="text-sm text-gray-500">No rules for this scope yet. Add the first one above.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Value</th>
                                <th className="px-3 py-2">Order range (₹)</th>
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
    rule: CommissionRule;
    saving: boolean;
    onSave: (input: CommissionRuleInput) => void;
    onDelete: () => void;
}) {
    const [ruleType, setRuleType] = useState<CommissionRuleType>(rule.rule_type);
    const [ratePercent, setRatePercent] = useState(rule.rate_permille / 10);
    const [fixedRupees, setFixedRupees] = useState(rule.fixed_amount_cents / 100);
    const [minOrder, setMinOrder] = useState<number | null>(rule.min_order_value ?? null);
    const [maxOrder, setMaxOrder] = useState<number | null>(rule.max_order_value ?? null);
    const [priority, setPriority] = useState(rule.priority);
    const [isActive, setIsActive] = useState(rule.is_active);

    return (
        <tr className="border-t">
            <td className="px-3 py-2">
                <select
                    className="rounded border px-2 py-1"
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as CommissionRuleType)}
                >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                </select>
                {rule.restaurant_id ? (
                    <span className="ml-2 text-xs text-gray-500">restaurant {rule.restaurant_id}</span>
                ) : (
                    <span className="ml-2 text-xs text-gray-500">global</span>
                )}
            </td>
            <td className="px-3 py-2">
                {ruleType === "percentage" ? (
                    <input
                        type="number"
                        step="0.1"
                        className="w-24 rounded border px-2 py-1"
                        value={ratePercent}
                        onChange={(e) => setRatePercent(Number(e.target.value))}
                    />
                ) : (
                    <input
                        type="number"
                        step="0.01"
                        className="w-24 rounded border px-2 py-1"
                        value={fixedRupees}
                        onChange={(e) => setFixedRupees(Number(e.target.value))}
                    />
                )}
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
                <input
                    type="number"
                    step="0.01"
                    className="w-20 rounded border px-2 py-1"
                    value={minOrder ?? ""}
                    placeholder="min"
                    onChange={(e) => setMinOrder(e.target.value === "" ? null : Number(e.target.value))}
                />
                {" – "}
                <input
                    type="number"
                    step="0.01"
                    className="w-20 rounded border px-2 py-1"
                    value={maxOrder ?? ""}
                    placeholder="max"
                    onChange={(e) => setMaxOrder(e.target.value === "" ? null : Number(e.target.value))}
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
                            rule_type: ruleType,
                            rate_permille: Math.round(ratePercent * 10),
                            fixed_amount_cents: Math.round(fixedRupees * 100),
                            min_order_value: minOrder,
                            max_order_value: maxOrder,
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
