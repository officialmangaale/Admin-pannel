"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import Modal from "@/components/Modal";
import { billingApi, BillingSummary } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: number;
    currentSummary: BillingSummary | null;
    onSuccess: () => void;
    showToast: (message: string, type: "success" | "error" | "warning") => void;
}

export default function SettlePartialModal({ isOpen, onClose, restaurantId, currentSummary, onSuccess, showToast }: Props) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const walletAmount = currentSummary?.wallet_amount ?? 0;
    const dueAmount = currentSummary?.due_amount ?? (walletAmount < 0 ? Math.abs(walletAmount) : 0);

    const parsedAmount = parseFloat(amount);
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

    const handleSubmit = async () => {
        if (!isValidAmount) return;
        if (parsedAmount > dueAmount && dueAmount > 0) {
            showToast("Amount exceeds outstanding due", "warning");
            return;
        }
        setSubmitting(true);
        try {
            await billingApi.settlePartial(restaurantId, {
                amount: parsedAmount,
                note: note.trim() || undefined,
            });
            showToast(`Partial settlement of ₹${parsedAmount.toLocaleString("en-IN")} completed`, "success");
            onSuccess();
            onClose();
            setAmount("");
            setNote("");
        } catch (err: any) {
            showToast(err.message || "Failed to settle partial due", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settle Partial Due" maxWidth="md">
            <div className="space-y-6">
                {/* Current Due Info */}
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Wallet size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Outstanding Due</p>
                        <p className={`text-lg font-bold ${dueAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            ₹{dueAmount.toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Settlement Amount *</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            step="1"
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>
                    {amount && !isValidAmount && (
                        <p className="text-xs text-red-500 mt-1 font-medium">Amount must be greater than 0</p>
                    )}
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Note (optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Payment reference or note…"
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
                        disabled={!isValidAmount || submitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Settle {isValidAmount ? `₹${parsedAmount.toLocaleString("en-IN")}` : ""}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
