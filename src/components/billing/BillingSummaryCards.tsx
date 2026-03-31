"use client";

import { Wallet, CreditCard, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, TrendingDown } from "lucide-react";
import type { BillingSummary, BillingPlanType } from "@/lib/api";

interface Props {
    summary: BillingSummary | null;
    loading: boolean;
}

export default function BillingSummaryCards({ summary, loading }: Props) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl mb-4" />
                        <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                        <div className="h-8 w-32 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center">
                <p className="text-slate-500 font-medium">No billing data available</p>
            </div>
        );
    }

    const planType: BillingPlanType | undefined = summary.plan_type || summary.current_plan?.type;
    const planName = summary.current_plan?.name || (planType === "PER_ORDER" ? "Per Order" : planType === "MONTHLY" ? "Monthly" : planType === "YEARLY" ? "Yearly" : "No Plan");
    const walletAmount = summary.wallet_amount ?? 0;
    const dueAmount = summary.due_amount ?? (walletAmount < 0 ? Math.abs(walletAmount) : 0);
    const isNearThreshold = planType === "PER_ORDER" && walletAmount <= -800 && walletAmount >= -1000;

    // Plan description
    const planDescription = summary.current_plan?.description || (planType === "PER_ORDER"
        ? "₹1 per paid order · All services included"
        : planType === "MONTHLY"
            ? "Monthly subscription · No per-order deduction"
            : planType === "YEARLY"
                ? "Yearly subscription · No per-order deduction"
                : "No active plan");

    // Service status
    let statusLabel = "Active";
    let StatusIcon = ShieldCheck;
    let statusBg = "bg-emerald-50 border-emerald-100";
    let statusIconColor = "text-emerald-500";
    let statusTextColor = "text-emerald-800";

    if (summary.is_blocked) {
        statusLabel = "Blocked";
        StatusIcon = ShieldX;
        statusBg = "bg-red-50 border-red-100";
        statusIconColor = "text-red-500";
        statusTextColor = "text-red-800";
    } else if (isNearThreshold) {
        statusLabel = "Warning";
        StatusIcon = ShieldAlert;
        statusBg = "bg-amber-50 border-amber-100";
        statusIconColor = "text-amber-500";
        statusTextColor = "text-amber-800";
    } else if (!summary.service_access) {
        statusLabel = "Restricted";
        StatusIcon = ShieldAlert;
        statusBg = "bg-orange-50 border-orange-100";
        statusIconColor = "text-orange-500";
        statusTextColor = "text-orange-800";
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Plan */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <CreditCard size={20} className="text-indigo-500" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        planType === "PER_ORDER"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : planType === "MONTHLY"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : planType === "YEARLY"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                        {planType || "NONE"}
                    </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
                <p className="text-xl font-bold text-slate-900">{planName}</p>
                <p className="text-xs font-medium text-slate-500 mt-2">{planDescription}</p>
            </div>

            {/* Wallet & Due */}
            <div className={`p-6 rounded-2xl border transition-shadow duration-300 hover:shadow-md ${
                dueAmount > 0 ? "border-red-100 bg-gradient-to-br from-red-50/50 to-white" : "border-slate-100 bg-gradient-to-br from-slate-50 to-white"
            }`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        dueAmount > 0 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"
                    }`}>
                        {dueAmount > 0
                            ? <TrendingDown size={20} className="text-red-500" />
                            : <Wallet size={20} className="text-emerald-500" />
                        }
                    </div>
                    {isNearThreshold && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                            <AlertTriangle size={10} /> Near Limit
                        </span>
                    )}
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Wallet Balance</p>
                <p className={`text-xl font-bold ${walletAmount < 0 ? "text-red-600" : "text-slate-900"}`}>
                    ₹{walletAmount.toLocaleString("en-IN")}
                </p>
                {dueAmount > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                            Amount Due: ₹{dueAmount.toLocaleString("en-IN")}
                        </span>
                    </div>
                )}
            </div>

            {/* Service Status */}
            <div className={`p-6 rounded-2xl border ${statusBg} hover:shadow-md transition-shadow duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/60 border border-white flex items-center justify-center`}>
                        <StatusIcon size={20} className={statusIconColor} />
                    </div>
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Service Access</p>
                <p className={`text-xl font-bold ${statusTextColor}`}>{statusLabel}</p>
                {summary.block_reason && (
                    <p className="text-xs font-medium text-red-600 mt-2 bg-red-100/60 px-2 py-1 rounded-md">
                        {summary.block_reason}
                    </p>
                )}
                {isNearThreshold && !summary.is_blocked && (
                    <p className="text-xs font-medium text-amber-600 mt-2">
                        Wallet near ₹-1000 threshold
                    </p>
                )}
            </div>
        </div>
    );
}
