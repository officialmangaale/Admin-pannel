"use client";

import { useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
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

export default function AdjustWalletModal({ isOpen, onClose, restaurantId, currentSummary, onSuccess, showToast }: Props) {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const walletAmount = currentSummary?.wallet_amount ?? 0;
    const parsedAmount = parseFloat(amount);
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount !== 0;
    const newBalance = isValidAmount ? walletAmount + parsedAmount : walletAmount;

    const handleSubmit = async () => {
        if (!isValidAmount) return;
        setSubmitting(true);
        try {
            await billingApi.adjustWallet(restaurantId, {
                amount: parsedAmount,
                reason: reason.trim() || undefined,
                note: reason.trim() || undefined,
            });
            const direction = parsedAmount > 0 ? "credited" : "debited";
            showToast(`₹${Math.abs(parsedAmount).toLocaleString("en-IN")} ${direction} to wallet`, "success");
            onSuccess();
            onClose();
            setAmount("");
            setReason("");
        } catch (err: any) {
            showToast(err.message || "Failed to adjust wallet", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Wallet Balance" maxWidth="md">
            <div className="space-y-6">
                {/* Current Balance */}
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                        <SlidersHorizontal size={18} className="text-sky-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Current Wallet</p>
                        <p className={`text-lg font-bold ${walletAmount < 0 ? "text-red-600" : "text-slate-800"}`}>
                            ₹{walletAmount.toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Adjustment Amount *
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                        Use positive value to add funds, negative value to deduct.
                    </p>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 500 or -200"
                            className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>
                    {amount && !isValidAmount && (
                        <p className="text-xs text-red-500 mt-1 font-medium">Enter a valid non-zero amount</p>
                    )}
                </div>

                {/* Preview */}
                {isValidAmount && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium text-slate-500">₹{walletAmount.toLocaleString("en-IN")}</span>
                            <span className={`font-bold ${parsedAmount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {parsedAmount > 0 ? "+" : ""}₹{parsedAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-slate-400">=</span>
                            <span className={`font-bold ${newBalance < 0 ? "text-red-600" : "text-slate-800"}`}>
                                ₹{newBalance.toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>
                )}

                {/* Reason */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reason / Note *</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        placeholder="Reason for this adjustment…"
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
                        disabled={!isValidAmount || !reason.trim() || submitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Apply Adjustment
                    </button>
                </div>
            </div>
        </Modal>
    );
}
