"use client";

import {
    Play, RefreshCw, ArrowRightLeft, XCircle,
    DollarSign, Wallet, SlidersHorizontal, RotateCcw
} from "lucide-react";

interface Props {
    onActivate: () => void;
    onSwitch: () => void;
    onRenew: () => void;
    onDeactivate: () => void;
    onSettleFull: () => void;
    onSettlePartial: () => void;
    onAdjustWallet: () => void;
    onRefresh: () => void;
    refreshing: boolean;
}

const actions = [
    { key: "activate", label: "Activate Plan", icon: Play, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200", desc: "Start a new billing plan" },
    { key: "switch", label: "Switch Plan", icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100 border-blue-200", desc: "Change to a different plan" },
    { key: "renew", label: "Renew Subscription", icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100 border-purple-200", desc: "Extend subscription" },
    { key: "settleFull", label: "Settle Full Due", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100 border-amber-200", desc: "Clear entire outstanding balance" },
    { key: "settlePartial", label: "Settle Partial", icon: Wallet, color: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200", desc: "Pay a portion of the due" },
    { key: "adjustWallet", label: "Adjust Wallet", icon: SlidersHorizontal, color: "text-sky-600", bg: "bg-sky-50 hover:bg-sky-100 border-sky-200", desc: "Manual wallet credit / debit" },
    { key: "deactivate", label: "Deactivate", icon: XCircle, color: "text-red-600", bg: "bg-red-50 hover:bg-red-100 border-red-200", desc: "Stop billing subscription" },
] as const;

export default function BillingActionsPanel(props: Props) {
    const handlerMap: Record<string, () => void> = {
        activate: props.onActivate,
        switch: props.onSwitch,
        renew: props.onRenew,
        settleFull: props.onSettleFull,
        settlePartial: props.onSettlePartial,
        adjustWallet: props.onAdjustWallet,
        deactivate: props.onDeactivate,
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Admin Actions</h3>
                <button
                    onClick={props.onRefresh}
                    disabled={props.refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                >
                    <RotateCcw size={14} className={props.refreshing ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.key}
                            onClick={handlerMap[action.key]}
                            className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 text-left hover:shadow-sm hover:-translate-y-0.5 ${action.bg}`}
                        >
                            <div className={`w-9 h-9 rounded-xl bg-white/80 border border-white flex items-center justify-center flex-shrink-0 shadow-sm ${action.color}`}>
                                <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-bold ${action.color}`}>{action.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{action.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
