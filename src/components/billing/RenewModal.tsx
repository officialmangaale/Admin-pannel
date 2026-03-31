"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Calendar } from "lucide-react";
import Modal from "@/components/Modal";
import { billingApi, BillingSubscription } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: number;
    currentSubscription: BillingSubscription | null;
    onSuccess: () => void;
    showToast: (message: string, type: "success" | "error") => void;
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        });
    } catch { return dateStr; }
}

export default function RenewModal({ isOpen, onClose, restaurantId, currentSubscription, onSuccess, showToast }: Props) {
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await billingApi.renew(restaurantId, { note: note.trim() || undefined });
            showToast("Monthly subscription renewed successfully", "success");
            onSuccess();
            onClose();
            setNote("");
        } catch (err: any) {
            showToast(err.message || "Failed to renew subscription", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Renew Monthly Subscription" maxWidth="md">
            <div className="space-y-6">
                {/* Current subscription info */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                    <div className="flex items-center gap-2">
                        <RefreshCw size={16} className="text-purple-500" />
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Current Subscription</p>
                    </div>
                    {currentSubscription ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Plan</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {currentSubscription.plan_name || currentSubscription.plan?.name || "Monthly"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Status</p>
                                <p className={`text-sm font-bold ${
                                    currentSubscription.status === "ACTIVE" ? "text-emerald-600" :
                                    currentSubscription.status === "EXPIRED" ? "text-amber-600" : "text-slate-600"
                                }`}>
                                    {currentSubscription.status}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Start Date</p>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400" />
                                    {formatDate(currentSubscription.start_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">End Date</p>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400" />
                                    {formatDate(currentSubscription.end_at)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No active subscription found</p>
                    )}
                </div>

                <p className="text-sm text-slate-600">
                    This action will renew the monthly subscription for another billing period. The new period will start from the current end date.
                </p>

                {/* Note */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Note (optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Reason for renewal…"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Renew Subscription
                    </button>
                </div>
            </div>
        </Modal>
    );
}
