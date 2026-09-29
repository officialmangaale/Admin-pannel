"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
    AdminRiderSummary,
    RiderSettlement,
    RiderWalletTransaction,
    WalletAdjustmentType,
    listRiders,
    getRiderWalletTransactions,
    getRiderSettlements,
    createRiderSettlement,
    createWalletAdjustment,
} from "@/services/riderApi";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const money = (v: number) => `₹${v.toFixed(2)}`;
const dateStr = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

/**
 * Rider Management (platform upgrade Module 10) backed by the Module 11
 * wallet/settlement ledger. Replaces a previous version of this page that
 * only rendered hardcoded sample riders with no backing API.
 *
 * Known gaps, shown rather than hidden: no geo/zone model exists, so there
 * is no "operational area" column — only current lat/lng when explicitly
 * requested (include_location), gated by nothing finer than "is admin" since
 * rider-service has no permission tiers yet. There is no block/suspend
 * action — rider-service exposes no such endpoint today.
 */
export default function RiderManagementPage() {
    const [search, setSearch] = useState("");
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [negativeWalletOnly, setNegativeWalletOnly] = useState(false);
    const [page, setPage] = useState(1);

    const [riders, setRiders] = useState<AdminRiderSummary[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const { toast, showToast, hideToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listRiders({
                search: search.trim() || undefined,
                onlineOnly,
                negativeWalletOnly,
                page,
                limit: 20,
            });
            setRiders(res.items);
            setTotalPages(res.pagination.total_pages || 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load riders");
        } finally {
            setLoading(false);
        }
    }, [search, onlineOnly, negativeWalletOnly, page]);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Rider Management</h1>
                    <p className="text-sm text-gray-500">
                        Wallet balance, COD pending, and settlement status come from the rider
                        wallet ledger. No geo/zone model exists yet, so there is no operational
                        area column.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="rounded-lg border p-4 grid gap-3 md:grid-cols-4">
                <input
                    className="rounded-md border px-3 py-2 text-sm"
                    placeholder="Search name or phone"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <label className="flex items-center gap-2 text-sm px-3 py-2">
                    <input
                        type="checkbox"
                        checked={onlineOnly}
                        onChange={(e) => {
                            setOnlineOnly(e.target.checked);
                            setPage(1);
                        }}
                    />
                    Online only
                </label>
                <label className="flex items-center gap-2 text-sm px-3 py-2">
                    <input
                        type="checkbox"
                        checked={negativeWalletOnly}
                        onChange={(e) => {
                            setNegativeWalletOnly(e.target.checked);
                            setPage(1);
                        }}
                    />
                    Negative wallet only
                </label>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
            ) : riders.length === 0 ? (
                <p className="text-sm text-gray-500">No riders match this filter.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2" />
                                <th className="px-3 py-2">Rider</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Orders</th>
                                <th className="px-3 py-2">Earnings</th>
                                <th className="px-3 py-2">Wallet balance</th>
                                <th className="px-3 py-2">Last settlement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {riders.map((r) => (
                                <RiderRow
                                    key={r.rider_id}
                                    rider={r}
                                    expanded={expanded === r.rider_id}
                                    onToggle={() => setExpanded(expanded === r.rider_id ? null : r.rider_id)}
                                    onSettled={() => {
                                        showToast("Settlement recorded", "success");
                                        void load();
                                    }}
                                    onError={(msg) => showToast(msg, "error")}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            <Toast toast={toast} onClose={hideToast} />
        </div>
    );
}

function RiderRow({
    rider,
    expanded,
    onToggle,
    onSettled,
    onError,
}: {
    rider: AdminRiderSummary;
    expanded: boolean;
    onToggle: () => void;
    onSettled: () => void;
    onError: (message: string) => void;
}) {
    const balanceColor = rider.is_negative_wallet ? "text-red-600" : "text-emerald-600";

    return (
        <>
            <tr className="border-t cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <td className="px-3 py-2">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </td>
                <td className="px-3 py-2">
                    <div className="font-medium">{rider.name || "(no name)"}</div>
                    <div className="text-xs text-gray-500">{rider.phone || "—"}</div>
                </td>
                <td className="px-3 py-2">
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            rider.is_online ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {rider.is_online ? (rider.is_available ? "Online" : "On delivery") : "Offline"}
                    </span>
                </td>
                <td className="px-3 py-2">
                    {rider.completed_orders}{" "}
                    <span className="text-xs text-gray-500">
                        done, {rider.cancelled_deliveries} cancelled
                    </span>
                </td>
                <td className="px-3 py-2">{money(rider.total_earnings)}</td>
                <td className={`px-3 py-2 font-medium ${balanceColor}`}>
                    {money(rider.wallet_balance)}
                    {rider.is_negative_wallet && (
                        <span className="ml-2 text-xs font-normal text-red-500">rider owes platform</span>
                    )}
                </td>
                <td className="px-3 py-2 text-xs">
                    {rider.last_settlement_status === "never_settled"
                        ? "Never settled"
                        : `${rider.last_settlement_status} · ${dateStr(rider.last_settlement_at)}`}
                </td>
            </tr>
            {expanded && (
                <tr className="border-t bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                        <RiderDetail rider={rider} onSettled={onSettled} onError={onError} />
                    </td>
                </tr>
            )}
        </>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}

function RiderDetail({
    rider,
    onSettled,
    onError,
}: {
    rider: AdminRiderSummary;
    onSettled: () => void;
    onError: (message: string) => void;
}) {
    const [transactions, setTransactions] = useState<RiderWalletTransaction[]>([]);
    const [settlements, setSettlements] = useState<RiderSettlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [amountReceived, setAmountReceived] = useState("0");
    const [amountPaid, setAmountPaid] = useState("0");
    const [adjustment, setAdjustment] = useState("0");
    const [paymentMode, setPaymentMode] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [isFullAndFinal, setIsFullAndFinal] = useState(false);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<WalletAdjustmentType>("incentive");
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentReference, setAdjustmentReference] = useState("");
    const [adjustmentNotes, setAdjustmentNotes] = useState("");
    const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [txnPage, settlementPage] = await Promise.all([
                getRiderWalletTransactions(rider.rider_id, 1, 10),
                getRiderSettlements(rider.rider_id, 1, 5),
            ]);
            setTransactions(txnPage.items);
            setSettlements(settlementPage.items);
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not load rider ledger");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rider.rider_id]);

    useEffect(() => {
        void load();
    }, [load]);

    const submitSettlement = async () => {
        const received = Number(amountReceived) || 0;
        const paid = Number(amountPaid) || 0;
        const adj = Number(adjustment) || 0;
        if (received === 0 && paid === 0 && adj === 0) {
            onError("Settlement must have a non-zero received, paid, or adjustment amount");
            return;
        }
        if (received < 0 || paid < 0) {
            onError("Amount received and amount paid must not be negative");
            return;
        }
        setSubmitting(true);
        try {
            await createRiderSettlement(rider.rider_id, {
                amount_received: received,
                amount_paid: paid,
                adjustment_amount: adj,
                payment_mode: paymentMode || undefined,
                reference_number: referenceNumber || undefined,
                is_full_and_final: isFullAndFinal,
                notes: notes || undefined,
            });
            setShowForm(false);
            setAmountReceived("0");
            setAmountPaid("0");
            setAdjustment("0");
            setPaymentMode("");
            setReferenceNumber("");
            setIsFullAndFinal(false);
            setNotes("");
            onSettled();
            void load();
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not record settlement");
        } finally {
            setSubmitting(false);
        }
    };

    const submitAdjustment = async () => {
        const amt = Number(adjustmentAmount);
        if (!amt) {
            onError("Amount must not be zero");
            return;
        }
        if (adjustmentType !== "manual_adjustment" && adjustmentType !== "refund_reversal" && amt < 0) {
            onError("Enter a positive magnitude — direction is applied automatically for this type");
            return;
        }
        setAdjustmentSubmitting(true);
        try {
            await createWalletAdjustment(rider.rider_id, {
                transaction_type: adjustmentType,
                amount: amt,
                reference_number: adjustmentReference || undefined,
                notes: adjustmentNotes || undefined,
            });
            setShowAdjustmentForm(false);
            setAdjustmentAmount("");
            setAdjustmentReference("");
            setAdjustmentNotes("");
            onSettled();
            void load();
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not record wallet adjustment");
        } finally {
            setAdjustmentSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading rider detail…
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Rider ID" value={rider.rider_id} />
                <Stat label="Total incentives" value={money(rider.total_incentives)} />
                <Stat label="Total penalties" value={money(rider.total_penalties)} />
                <Stat label="COD pending" value={money(rider.cod_pending)} />
                <Stat label="Platform receivable" value={money(rider.platform_receivable)} />
                <Stat label="Rider payable" value={money(rider.rider_payable)} />
                <Stat
                    label="Location"
                    value={
                        rider.current_latitude != null && rider.current_longitude != null
                            ? `${rider.current_latitude.toFixed(4)}, ${rider.current_longitude.toFixed(4)}`
                            : "not requested"
                    }
                />
                <Stat label="Current order" value={rider.current_order_id ? `#${rider.current_order_id}` : "none"} />
            </div>

            <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Recent wallet transactions</h4>
                {transactions.length === 0 ? (
                    <p className="text-xs text-gray-500">No wallet transactions yet.</p>
                ) : (
                    <table className="w-full text-xs border rounded-md overflow-hidden">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="px-2 py-1">Date</th>
                                <th className="px-2 py-1">Type</th>
                                <th className="px-2 py-1">Amount</th>
                                <th className="px-2 py-1">Balance after</th>
                                <th className="px-2 py-1">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => (
                                <tr key={t.id} className="border-t bg-white">
                                    <td className="px-2 py-1">{dateStr(t.created_at)}</td>
                                    <td className="px-2 py-1">{t.transaction_type}</td>
                                    <td className={`px-2 py-1 ${t.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                        {money(t.amount)}
                                    </td>
                                    <td className="px-2 py-1">{money(t.balance_after)}</td>
                                    <td className="px-2 py-1">{t.notes || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Settlement history</h4>
                {settlements.length === 0 ? (
                    <p className="text-xs text-gray-500">No settlements recorded yet.</p>
                ) : (
                    <table className="w-full text-xs border rounded-md overflow-hidden">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="px-2 py-1">Date</th>
                                <th className="px-2 py-1">Received</th>
                                <th className="px-2 py-1">Paid</th>
                                <th className="px-2 py-1">Adjustment</th>
                                <th className="px-2 py-1">Closing balance</th>
                                <th className="px-2 py-1">Final?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settlements.map((s) => (
                                <tr key={s.id} className="border-t bg-white">
                                    <td className="px-2 py-1">{dateStr(s.created_at)}</td>
                                    <td className="px-2 py-1">{money(s.amount_received)}</td>
                                    <td className="px-2 py-1">{money(s.amount_paid)}</td>
                                    <td className="px-2 py-1">{money(s.adjustment_amount)}</td>
                                    <td className="px-2 py-1">{money(s.closing_balance)}</td>
                                    <td className="px-2 py-1">{s.is_full_and_final ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                    Record settlement
                </button>
            ) : (
                <div className="rounded-md border bg-white p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <label className="text-xs text-gray-600">
                            Amount received (rider → company)
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Amount paid (company → rider)
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Adjustment
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={adjustment}
                                onChange={(e) => setAdjustment(e.target.value)}
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Payment mode
                            <input
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                placeholder="cash, upi, bank_transfer…"
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
                            Full and final settlement
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
                            onClick={() => void submitSettlement()}
                            disabled={submitting}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Save settlement"}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {!showAdjustmentForm ? (
                <button
                    onClick={() => setShowAdjustmentForm(true)}
                    className="ml-2 rounded-md border px-3 py-1.5 text-xs font-medium"
                >
                    Post adjustment
                </button>
            ) : (
                <div className="rounded-md border bg-white p-3 space-y-3">
                    <p className="text-xs text-gray-500">
                        For incentive / penalty / rider payment / company payment / COD liability,
                        enter a positive amount — direction is applied automatically. Manual
                        adjustment and refund reversal take the amount as entered (can be negative).
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <label className="text-xs text-gray-600">
                            Type
                            <select
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={adjustmentType}
                                onChange={(e) => setAdjustmentType(e.target.value as WalletAdjustmentType)}
                            >
                                <option value="incentive">Incentive (+)</option>
                                <option value="penalty">Penalty (−)</option>
                                <option value="rider_payment_to_company">Rider payment to company (+)</option>
                                <option value="company_payment_to_rider">Company payment to rider (−)</option>
                                <option value="cod_liability">COD liability (−)</option>
                                <option value="manual_adjustment">Manual adjustment (signed)</option>
                                <option value="refund_reversal">Refund reversal (signed)</option>
                            </select>
                        </label>
                        <label className="text-xs text-gray-600">
                            Amount
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                            />
                        </label>
                        <label className="text-xs text-gray-600">
                            Reference number
                            <input
                                className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                value={adjustmentReference}
                                onChange={(e) => setAdjustmentReference(e.target.value)}
                            />
                        </label>
                    </div>
                    <label className="block text-xs text-gray-600">
                        Notes
                        <textarea
                            className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                            value={adjustmentNotes}
                            onChange={(e) => setAdjustmentNotes(e.target.value)}
                            rows={2}
                        />
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => void submitAdjustment()}
                            disabled={adjustmentSubmitting}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                            {adjustmentSubmitting ? "Saving…" : "Save adjustment"}
                        </button>
                        <button
                            onClick={() => setShowAdjustmentForm(false)}
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
