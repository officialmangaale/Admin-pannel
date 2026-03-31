"use client";

import { History } from "lucide-react";
import type { BillingSubscription } from "@/lib/api";

interface Props {
    subscriptions: BillingSubscription[];
    loading: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    ACTIVE: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    EXPIRED: { bg: "bg-amber-100 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    INACTIVE: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
    CANCELLED: { bg: "bg-red-100 border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

function formatDate(dateStr?: string): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

export default function SubscriptionHistoryTable({ subscriptions, loading }: Props) {
    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History size={18} className="text-slate-400" />
                    Subscription History
                </h3>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 animate-pulse">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                            <div className="h-4 w-16 bg-slate-200 rounded" />
                            <div className="h-4 w-16 bg-slate-200 rounded" />
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
                <History size={18} className="text-slate-400" />
                Subscription History
                {subscriptions.length > 0 && (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {subscriptions.length} records
                    </span>
                )}
            </h3>

            {subscriptions.length === 0 ? (
                <div className="p-12 rounded-2xl border border-slate-200 bg-slate-50/50 text-center">
                    <History size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No subscription history</p>
                </div>
            ) : (
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">End</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin ID</th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {subscriptions.map((sub) => {
                                    const planType = sub.plan_type || sub.plan?.type;
                                    const planName = sub.plan_name || sub.plan?.name || sub.plan_code || "—";
                                    const cfg = statusConfig[sub.status] || statusConfig.INACTIVE;
                                    return (
                                        <tr key={sub.id} className="hover:bg-amber-50/20 transition-colors">
                                            <td className="py-3 px-5 text-sm font-semibold text-slate-800">
                                                {planName}
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    planType === "PER_ORDER"
                                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                        : "bg-purple-100 text-purple-700 border border-purple-200"
                                                }`}>
                                                    {planType || "—"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-sm font-medium text-slate-700 text-right whitespace-nowrap">
                                                {sub.amount != null ? `₹${sub.amount.toLocaleString("en-IN")}` : "—"}
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                                {formatDate(sub.start_at)}
                                            </td>
                                            <td className="py-3 px-5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                                {formatDate(sub.end_at)}
                                            </td>
                                            <td className="py-3 px-5 text-xs font-medium text-slate-500">
                                                {sub.activated_by_admin_id ?? "—"}
                                            </td>
                                            <td className="py-3 px-5 text-xs text-slate-500 max-w-[180px] truncate" title={sub.note || ""}>
                                                {sub.note || "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
