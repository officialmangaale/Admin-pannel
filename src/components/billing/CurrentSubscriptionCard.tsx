"use client";

import { Calendar, Clock, Shield, AlertTriangle } from "lucide-react";
import type { BillingSubscription } from "@/lib/api";

interface Props {
    subscription: BillingSubscription | null;
    loading: boolean;
}

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

function getDaysRemaining(endDate?: string): number | null {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    ACTIVE: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    EXPIRED: { bg: "bg-amber-100 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    INACTIVE: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
    CANCELLED: { bg: "bg-red-100 border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

export default function CurrentSubscriptionCard({ subscription, loading }: Props) {
    if (loading) {
        return (
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse">
                <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                            <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                            <div className="h-5 w-24 bg-slate-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Shield size={24} className="text-slate-400" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-700">No Active Subscription</p>
                    <p className="text-xs text-slate-500 mt-0.5">Activate a plan to begin billing for this restaurant.</p>
                </div>
            </div>
        );
    }

    const planType = subscription.plan_type || subscription.plan?.type;
    const planName = subscription.plan_name || subscription.plan?.name || "Unknown Plan";
    const statusCfg = statusConfig[subscription.status] || statusConfig.INACTIVE;
    const daysRemaining = getDaysRemaining(subscription.end_at);
    const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;

    return (
        <div className="p-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    Current Subscription
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${statusCfg.bg} ${statusCfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {subscription.status}
                    </span>
                    {isExpiringSoon && subscription.status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                            <AlertTriangle size={12} />
                            Expiring Soon
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Plan</p>
                    <p className="text-sm font-bold text-slate-800">{planName}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        planType === "PER_ORDER"
                            ? "bg-blue-100 text-blue-700"
                            : planType === "MONTHLY"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-amber-100 text-amber-700"
                    }`}>
                        {planType || "—"}
                    </span>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Started</p>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {formatDate(subscription.start_at)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        {planType === "PER_ORDER" ? "Expiry" : "Valid Until"}
                    </p>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {planType === "PER_ORDER" ? "No expiry" : formatDate(subscription.end_at)}
                    </p>
                    {planType !== "PER_ORDER" && daysRemaining !== null && subscription.status === "ACTIVE" && (
                        <p className={`text-xs font-medium mt-1 ${daysRemaining <= 7 ? "text-orange-600" : "text-slate-500"}`}>
                            {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining` : daysRemaining === 0 ? "Expires today" : "Expired"}
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-sm font-bold text-slate-800">
                        {planType === "PER_ORDER"
                            ? "₹1 / order"
                            : subscription.amount
                                ? `₹${subscription.amount.toLocaleString("en-IN")}`
                                : planType === "YEARLY" ? "₹3,999" : "₹800"
                        }
                    </p>
                </div>
            </div>

            {subscription.note && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">Note:</span> {subscription.note}
                    </p>
                </div>
            )}
        </div>
    );
}
