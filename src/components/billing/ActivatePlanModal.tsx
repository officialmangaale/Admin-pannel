"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { billingApi, BillingPlan } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: number;
    onSuccess: () => void;
    showToast: (message: string, type: "success" | "error") => void;
}

export default function ActivatePlanModal({ isOpen, onClose, restaurantId, onSuccess, showToast }: Props) {
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<number | "">("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedPlanId("");
            setNote("");
            fetchPlans();
        }
    }, [isOpen]);

    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const res = await billingApi.getPlans();
            const activePlans = (res.data?.plans || []).filter((p) => p.is_active);
            setPlans(activePlans);
        } catch (err: any) {
            showToast(err.message || "Failed to load plans", "error");
        } finally {
            setLoadingPlans(false);
        }
    };

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);

    const handleSubmit = async () => {
        if (!selectedPlanId) return;
        setSubmitting(true);
        try {
            await billingApi.activate(restaurantId, {
                plan_id: selectedPlanId as number,
                note: note.trim() || undefined,
            });
            showToast("Plan activated successfully", "success");
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.message || "Failed to activate plan", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Activate Billing Plan" maxWidth="lg">
            <div className="space-y-6">
                {/* Plan Selection */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Plan *</label>
                    {loadingPlans ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                            <Loader2 size={16} className="animate-spin" /> Loading plans…
                        </div>
                    ) : (
                        <select
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : "")}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white transition-all"
                        >
                            <option value="">Choose a plan…</option>
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} — {plan.type} — ₹{plan.price}
                                    {plan.type === "MONTHLY" ? ` / ${plan.duration_days} days` : " / order"}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Selected Plan Preview */}
                {selectedPlan && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Summary</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">{selectedPlan.name}</span>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                selectedPlan.type === "PER_ORDER"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-purple-100 text-purple-700 border border-purple-200"
                            }`}>
                                {selectedPlan.type}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">
                            Price: <span className="font-bold">₹{selectedPlan.price}</span>
                            {selectedPlan.type === "MONTHLY" && <span> / {selectedPlan.duration_days} days</span>}
                            {selectedPlan.type === "PER_ORDER" && <span> per paid order</span>}
                        </p>
                        {selectedPlan.description && (
                            <p className="text-xs text-slate-500">{selectedPlan.description}</p>
                        )}
                    </div>
                )}

                {/* Note */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Note (optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Add a note for this activation…"
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
                        disabled={!selectedPlanId || submitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Activate Plan
                    </button>
                </div>
            </div>
        </Modal>
    );
}
