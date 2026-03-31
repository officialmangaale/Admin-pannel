"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Modal from "@/components/Modal";
import { billingApi, BillingSummary } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: number;
    currentSummary: BillingSummary | null;
    onSuccess: () => void;
    showToast: (message: string, type: "success" | "error") => void;
}

export default function DeactivateModal({ isOpen, onClose, restaurantId, currentSummary, onSuccess, showToast }: Props) {
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const planName = currentSummary?.current_plan?.name || "Current Plan";

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await billingApi.deactivate(restaurantId, { note: note.trim() || undefined });
            showToast("Subscription deactivated", "success");
            onSuccess();
            onClose();
            setNote("");
        } catch (err: any) {
            showToast(err.message || "Failed to deactivate", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Deactivate Subscription" maxWidth="md">
            <div className="space-y-6">
                {/* Warning */}
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-800">This action may block service access</p>
                        <p className="text-xs text-red-600 mt-1">
                            Deactivating the subscription for <span className="font-bold">{planName}</span> may prevent this restaurant from processing orders depending on its current billing state.
                        </p>
                    </div>
                </div>

                {/* Current state */}
                {currentSummary && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current State</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-slate-500">Plan</p>
                                <p className="text-sm font-bold text-slate-800">{planName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Wallet</p>
                                <p className={`text-sm font-bold ${currentSummary.wallet_amount < 0 ? "text-red-600" : "text-slate-800"}`}>
                                    ₹{currentSummary.wallet_amount.toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Note */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Note (optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Reason for deactivation…"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none transition-all"
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
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Deactivate
                    </button>
                </div>
            </div>
        </Modal>
    );
}
