"use client";

import { useState } from "react";
import { Loader2, DollarSign } from "lucide-react";
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

export default function SettleFullModal({ isOpen, onClose, restaurantId, currentSummary, onSuccess, showToast }: Props) {
    const [submitting, setSubmitting] = useState(false);

    const walletAmount = currentSummary?.wallet_amount ?? 0;
    const dueAmount = currentSummary?.due_amount ?? (walletAmount < 0 ? Math.abs(walletAmount) : 0);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await billingApi.settleFull(restaurantId);
            showToast("Full settlement completed successfully", "success");
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.message || "Failed to settle dues", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settle Full Due" maxWidth="md">
            <div className="space-y-6">
                {/* Amount breakdown */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-amber-500" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settlement Summary</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Current Wallet</p>
                            <p className={`text-lg font-bold ${walletAmount < 0 ? "text-red-600" : "text-slate-800"}`}>
                                ₹{walletAmount.toLocaleString("en-IN")}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Amount Due</p>
                            <p className={`text-lg font-bold ${dueAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                ₹{dueAmount.toLocaleString("en-IN")}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-slate-600">
                    This will record a full settlement of <span className="font-bold text-slate-800">₹{dueAmount.toLocaleString("en-IN")}</span> and reset the outstanding balance to ₹0.
                </p>

                {dueAmount === 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-sm font-medium text-emerald-700">No outstanding dues to settle.</p>
                    </div>
                )}

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
                        disabled={submitting || dueAmount === 0}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Settle ₹{dueAmount.toLocaleString("en-IN")}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
