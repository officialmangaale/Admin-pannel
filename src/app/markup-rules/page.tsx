"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import {
    ItemMarkupRule,
    ItemMarkupRuleInput,
    MarkupRuleScope,
    MarkupRuleType,
    createMarkupRule,
    deleteMarkupRule,
    listMarkupRules,
    updateMarkupRule,
} from "@/services/markupRuleService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const emptyRule: ItemMarkupRuleInput = {
    scope: "global",
    rule_type: "percentage",
    rate_permille: 0,
    fixed_amount_cents: 0,
    is_active: true,
    priority: 0,
};

function scopeIdOf(rule: { scope: MarkupRuleScope; menu_item_id?: number | null; restaurant_id?: number | null; category_id?: number | null }) {
    if (rule.scope === "item") return rule.menu_item_id ?? null;
    if (rule.scope === "restaurant") return rule.restaurant_id ?? null;
    if (rule.scope === "category") return rule.category_id ?? null;
    return null;
}

/**
 * Customer-Facing Dynamic Item Pricing (platform upgrade Module 4).
 *
 * Resolution priority is fixed (not admin-configurable yet — that is
 * Module 16's job): item beats restaurant beats category beats global.
 * Location-based markup is not implemented; there is no geo/zone data model
 * in this platform yet.
 *
 * Not wired into live checkout yet — see
 * restaurant-service/services/markup_pricing.go for why and what's needed
 * to flip it on.
 */
export default function MarkupRulesPage() {
    const { toast, showToast, hideToast } = useToast();
    const [rules, setRules] = useState<ItemMarkupRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<number | "new" | null>(null);
    const [newRule, setNewRule] = useState<ItemMarkupRuleInput>(emptyRule);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRules(await listMarkupRules(undefined, undefined, true));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load markup rules");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const create = async () => {
        if (newRule.scope !== "global" && !getScopeId(newRule)) {
            showToast(`Set a${newRule.scope === "item" ? "n item" : ` ${newRule.scope}`} id for this scope`, "error");
            return;
        }
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
            await createMarkupRule(newRule);
            setNewRule(emptyRule);
            showToast("Markup rule created", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not create the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    const save = async (rule: ItemMarkupRule, input: ItemMarkupRuleInput) => {
        setSaving(rule.id);
        try {
            await updateMarkupRule(rule.id, input);
            showToast("Markup rule updated", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save the rule", "error");
        } finally {
            setSaving(null);
        }
    };

    const remove = async (rule: ItemMarkupRule) => {
        if (!confirm("Delete this markup rule?")) return;
        setSaving(rule.id);
        try {
            await deleteMarkupRule(rule.id);
            showToast("Markup rule deleted", "success");
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
                    <h1 className="text-2xl font-semibold">Markup Rules</h1>
                    <p className="text-sm text-gray-500">
                        Controls the gap between a restaurant&apos;s base price and what the
                        customer sees. Resolution priority: item-specific, then
                        restaurant-specific, then category-specific, then global.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <h2 className="font-medium">Add a rule</h2>
                {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}
                <div className="grid gap-3 md:grid-cols-8 items-end">
                    <Field label="Scope">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.scope}
                            onChange={(e) => setNewRule({ ...emptyRule, scope: e.target.value as MarkupRuleScope, rule_type: newRule.rule_type })}
                        >
                            <option value="global">Global</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="category">Category</option>
                            <option value="item">Item</option>
                        </select>
                    </Field>
                    {newRule.scope !== "global" && (
                        <Field label={`${newRule.scope} id`}>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={getScopeId(newRule) ?? ""}
                                onChange={(e) => setNewRule(setScopeId(newRule, e.target.value))}
                            />
                        </Field>
                    )}
                    <Field label="Type">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newRule.rule_type}
                            onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as MarkupRuleType })}
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
                <p className="text-sm text-gray-500">No markup rules yet. Add the first one above.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2">Scope</th>
                                <th className="px-3 py-2">Value</th>
                                <th className="px-3 py-2">Order range (₹)</th>
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

function getScopeId(rule: ItemMarkupRuleInput): string | number | null {
    if (rule.scope === "item") return rule.menu_item_id ?? "";
    if (rule.scope === "restaurant") return rule.restaurant_id ?? "";
    if (rule.scope === "category") return rule.category_id ?? "";
    return null;
}

function setScopeId(rule: ItemMarkupRuleInput, value: string): ItemMarkupRuleInput {
    const id = value === "" ? null : Number(value.replace(/[^0-9]/g, ""));
    if (rule.scope === "item") return { ...rule, menu_item_id: id };
    if (rule.scope === "restaurant") return { ...rule, restaurant_id: id };
    if (rule.scope === "category") return { ...rule, category_id: id };
    return rule;
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
    rule: ItemMarkupRule;
    saving: boolean;
    onSave: (input: ItemMarkupRuleInput) => void;
    onDelete: () => void;
}) {
    const [ruleType, setRuleType] = useState<MarkupRuleType>(rule.rule_type);
    const [ratePercent, setRatePercent] = useState(rule.rate_permille / 10);
    const [fixedRupees, setFixedRupees] = useState(rule.fixed_amount_cents / 100);
    const [minOrder, setMinOrder] = useState<number | null>(rule.min_order_value ?? null);
    const [maxOrder, setMaxOrder] = useState<number | null>(rule.max_order_value ?? null);
    const [isActive, setIsActive] = useState(rule.is_active);

    return (
        <tr className="border-t">
            <td className="px-3 py-2">
                <span className="font-medium">{rule.scope}</span>
                {scopeIdOf(rule) !== null && <span className="ml-2 text-xs text-gray-500">#{scopeIdOf(rule)}</span>}
            </td>
            <td className="px-3 py-2">
                <select
                    className="mr-2 rounded border px-2 py-1"
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as MarkupRuleType)}
                >
                    <option value="percentage">%</option>
                    <option value="fixed">₹</option>
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
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            </td>
            <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button
                    onClick={() =>
                        onSave({
                            scope: rule.scope,
                            menu_item_id: rule.menu_item_id,
                            restaurant_id: rule.restaurant_id,
                            category_id: rule.category_id,
                            rule_type: ruleType,
                            rate_permille: Math.round(ratePercent * 10),
                            fixed_amount_cents: Math.round(fixedRupees * 100),
                            min_order_value: minOrder,
                            max_order_value: maxOrder,
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
