"use client";

import { useState, useEffect, useCallback } from "react";
import {
    restaurantPayoutApi,
    creditLimitApi,
    RestaurantPayoutTransaction,
    RestaurantPayout,
    CreditLimitRule,
} from "@/lib/api";
import { useToast } from "@/lib/useToast";
import Toast from "@/components/Toast";

interface Props {
    restaurantId: number;
}

const money = (v: number) => `₹${v.toFixed(2)}`;
const dateStr = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

/**
 * Restaurant order-revenue payout ledger + credit-limit control (platform
 * upgrade Module 12). Separate from BillingTab above it: that tracks what
 * the restaurant owes the platform for subscription fees; this tracks the
 * opposite direction (what the platform owes the restaurant for completed
 * orders) plus the admin-configurable auto-suspend threshold on the
 * subscription wallet.
 */
export default function RestaurantPayoutSection({ restaurantId }: Props) {
    const { toast, showToast, hideToast } = useToast();

    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<RestaurantPayoutTransaction[]>([]);
    const [payouts, setPayouts] = useState<RestaurantPayout[]>([]);
    const [loading, setLoading] = useState(true);

    const [globalLimit, setGlobalLimit] = useState<CreditLimitRule | null>(null);
    const [restaurantLimit, setRestaurantLimit] = useState<CreditLimitRule | null>(null);
    const [editingLimit, setEditingLimit] = useState(false);
    const [limitInput, setLimitInput] = useState("");

    const [showPayoutForm, setShowPayoutForm] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("0");
    const [adjustmentAmount, setAdjustmentAmount] = useState("0");
    const [paymentMode, setPaymentMode] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [isFullAndFinal, setIsFullAndFinal] = useState(false);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [balRes, txnPage, payoutPage, limitsRes] = await Promise.all([
                restaurantPayoutApi.getBalance(restaurantId),
                restaurantPayoutApi.getTransactions(restaurantId, 1, 10),
                restaurantPayoutApi.getPayouts(restaurantId, 1, 5),
                creditLimitApi.list(),
            ]);
            setBalance(balRes.data.balance);
            setTransactions(txnPage.items);
            setPayouts(payoutPage.items);
            const rules = limitsRes.data || [];
            setGlobalLimit(rules.find((r) => r.restaurant_id === null) || null);
            setRestaurantLimit(rules.find((r) => r.restaurant_id === restaurantId) || null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not load payout data", "error");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    useEffect(() => {
        void load();
    }, [load]);

    const effectiveLimit = restaurantLimit ?? globalLimit;

    const saveLimitOverride = async () => {
        const val = Number(limitInput);
        if (Number.isNaN(val)) {
            showToast("Enter a valid number", "error");
            return;
        }
        try {
            await creditLimitApi.upsert(restaurantId, val);
            showToast("Credit limit override saved", "success");
            setEditingLimit(false);
            void load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save credit limit", "error");
        }
    };

    const removeOverride = async () => {
        try {
            await creditLimitApi.deleteOverride(restaurantId);
            showToast("Reverted to global credit limit", "success");
            void load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not remove override", "error");
        }
    };

    const submitPayout = async () => {
        const payout = Number(payoutAmount) || 0;
        const adj = Number(adjustmentAmount) || 0;
        if (payout === 0 && adj === 0) {
            showToast("Payout must have a non-zero payout or adjustment amount", "error");
            return;
        }
        if (payout < 0) {
            showToast("Payout amount must not be negative", "error");
            return;
        }
        setSubmitting(true);
        try {
            await restaurantPayoutApi.createPayout(restaurantId, {
                payout_amount: payout,
                adjustment_amount: adj,
                payment_mode: paymentMode || undefined,
                reference_number: referenceNumber || undefined,
                is_full_and_final: isFullAndFinal,
                notes: notes || undefined,
            });
            showToast("Payout recorded", "success");
            setShowPayoutForm(false);
            setPayoutAmount("0");
            setAdjustmentAmount("0");
            setPaymentMode("");
            setReferenceNumber("");
            setIsFullAndFinal(false);
            setNotes("");
            void load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not record payout", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Loading payout data…</div>;
    }

    return (
        <div className="space-y-6">
            <Toast toast={toast} onClose={hideToast} />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Payout balance (platform owes restaurant)</div>
                    <div className="text-2xl font-semibold mt-1">{money(balance ?? 0)}</div>
                    <p className="text-xs text-gray-500 mt-1">
                        Credited automatically from each completed order&apos;s pricing snapshot. POS/QR
                        orders have no snapshot and are not credited.
                    </p>
                </div>

                <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Order-block credit limit</div>
                    {!editingLimit ? (
                        <>
                            <div className="text-2xl font-semibold mt-1">
                                {effectiveLimit ? money(effectiveLimit.wallet_floor_amount) : "—"}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {restaurantLimit
                                    ? "Restaurant-specific override."
                                    : `Using the global default${globalLimit ? "" : " (not yet configured)"}.`}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        setLimitInput(String(effectiveLimit?.wallet_floor_amount ?? -1000));
                                        setEditingLimit(true);
                                    }}
                                    className="rounded-md border px-2 py-1 text-xs font-medium"
                                >
                                    Set override
                                </button>
                                {restaurantLimit && (
                                    <button
                                        onClick={() => void removeOverride()}
                                        className="rounded-md border px-2 py-1 text-xs font-medium"
                                    >
                                        Revert to global
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="mt-1 space-y-2">
                            <input
                                type="number"
                                className="w-full rounded-md border px-2 py-1 text-sm"
                                value={limitInput}
                                onChange={(e) => setLimitInput(e.target.value)}
                                placeholder="-1000"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => void saveLimitOverride()}
                                    className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingLimit(false)}
                                    className="rounded-md border px-2 py-1 text-xs font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Recent payout transactions</h4>
                {transactions.length === 0 ? (
                    <p className="text-xs text-gray-500">No payout transactions yet.</p>
                ) : (
                    <table className="w-full text-xs border rounded-md overflow-hidden">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="px-2 py-1">Date</th>
                                <th className="px-2 py-1">Type</th>
                                <th className="px-2 py-1">Order</th>
                                <th className="px-2 py-1">Amount</th>
                                <th className="px-2 py-1">Balance after</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => (
                                <tr key={t.id} className="border-t bg-white">
                                    <td className="px-2 py-1">{dateStr(t.created_at)}</td>
                                    <td className="px-2 py-1">{t.transaction_type}</td>
                                    <td className="px-2 py-1">{t.order_id ?? "—"}</td>
                                    <td className={`px-2 py-1 ${t.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                        {money(t.amount)}
                                    </td>
                                    <td className="px-2 py-1">{money(t.balance_after)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Payout history</h4>
                {payouts.length === 0 ? (
                    <p className="text-xs text-gray-500">No payouts recorded yet.</p>
                ) : (
                    <table className="w-full text-xs border rounded-md overflow-hidden">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="px-2 py-1">Date</th>
                                <th className="px-2 py-1">Payout</th>
                                <th className="px-2 py-1">Adjustment</th>
                                <th className="px-2 py-1">Closing balance</th>
                                <th className="px-2 py-1">Final?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map((p) => (
                                <tr key={p.id} className="border-t bg-white">
                                    <td className="px-2 py-1">{dateStr(p.created_at)}</td>
                                    <td className="px-2 py-1">{money(p.payout_amount)}</td>
                                    <td className="px-2 py-1">{money(p.adjustment_amount)}</td>
                                    <td className="px-2 py-1">{money(p.closing_balance)}</td>
                                    <td className="px-2 py-1">{p.is_full_and_final ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!showPayoutForm ? (
                <button
                    onClick={() => setShowPayoutForm(true)}
                    className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                    Record payout
                </button>
            ) : (
                <div className="rounded-md border bg-white p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <label className="text-xs text-gray-600">
                            Payout amount (company → restaurant)
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Adjustment
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Payment mode
                            <input
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                placeholder="upi, bank_transfer…"
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Reference number
                            <input
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                            />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-600 mt-5">
                            <input
                                type="checkbox"
                                checked={isFullAndFinal}
                                onChange={(e) => setIsFullAndFinal(e.target.checked)}
                            />
                            Full and final payout
                        </label>
                    </div>
                    <label className="block text-xs text-gray-600">
                        Notes
                        <textarea
                            className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => void submitPayout()}
                            disabled={submitting}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Save payout"}
                        </button>
                        <button
                            onClick={() => setShowPayoutForm(false)}
                            className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
