"use client";

import { useState } from "react";
import { Copy, Check, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import type { LedgerEntry, LedgerEntryType } from "@/lib/api";

interface Props {
    entries: LedgerEntry[];
    loading: boolean;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
    DEBIT: { bg: "bg-red-100 border-red-200", text: "text-red-700", label: "Debit" },
    CREDIT: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-700", label: "Credit" },
    ADJUSTMENT: { bg: "bg-blue-100 border-blue-200", text: "text-blue-700", label: "Adjustment" },
    SETTLEMENT: { bg: "bg-teal-100 border-teal-200", text: "text-teal-700", label: "Settlement" },
    FEE: { bg: "bg-amber-100 border-amber-200", text: "text-amber-700", label: "Platform Fee" },
    REFUND: { bg: "bg-purple-100 border-purple-200", text: "text-purple-700", label: "Refund" },
};

function formatDateTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
            " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
        return dateStr;
    }
}

function CopyableId({ value }: { value: string | number }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={handleCopy} className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 hover:text-amber-600 transition-colors bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            #{String(value)}
            {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
        </button>
    );
}

export default function BillingLedgerTable({ entries, loading, page, totalPages, onPageChange }: Props) {
    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Receipt size={18} className="text-slate-400" />
                    Transaction Ledger
                </h3>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 animate-pulse">
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                            <div className="h-4 w-16 bg-slate-200 rounded" />
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                            <div className="flex-1" />
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={18} className="text-slate-400" />
                Transaction Ledger
                {entries.length > 0 && (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {entries.length} entries
                    </span>
                )}
            </h3>

            {entries.length === 0 ? (
                <div className="p-12 rounded-2xl border border-slate-200 bg-slate-50/50 text-center">
                    <Receipt size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No transactions recorded yet</p>
                </div>
            ) : (
                <>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Before</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">After</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note</th>
                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {entries.map((entry) => {
                                        const cfg = typeConfig[entry.type] || typeConfig.DEBIT;
                                        const isPositive = entry.amount >= 0;
                                        return (
                                            <tr key={entry.id} className="hover:bg-amber-50/20 transition-colors">
                                                <td className="py-3 px-5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                                    {formatDateTime(entry.created_at)}
                                                </td>
                                                <td className="py-3 px-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.text}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className={`py-3 px-5 text-sm font-bold text-right whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                                                    {isPositive ? "+" : ""}₹{Math.abs(entry.amount).toLocaleString("en-IN")}
                                                </td>
                                                <td className="py-3 px-5 text-xs font-medium text-slate-500 text-right whitespace-nowrap">
                                                    ₹{entry.balance_before?.toLocaleString("en-IN") ?? "—"}
                                                </td>
                                                <td className="py-3 px-5 text-xs font-medium text-slate-700 text-right whitespace-nowrap">
                                                    ₹{entry.balance_after?.toLocaleString("en-IN") ?? "—"}
                                                </td>
                                                <td className="py-3 px-5">
                                                    {entry.order_id ? <CopyableId value={entry.order_id} /> : <span className="text-xs text-slate-400">—</span>}
                                                </td>
                                                <td className="py-3 px-5 text-xs text-slate-500 max-w-[200px] truncate" title={entry.note || ""}>
                                                    {entry.note || "—"}
                                                </td>
                                                <td className="py-3 px-5 text-xs font-medium text-slate-500">
                                                    {entry.created_by || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm font-medium text-slate-500">
                                Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onPageChange(page - 1)}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors font-semibold text-sm flex items-center gap-1 shadow-sm"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <button
                                    onClick={() => onPageChange(page + 1)}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors font-semibold text-sm flex items-center gap-1 shadow-sm"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
