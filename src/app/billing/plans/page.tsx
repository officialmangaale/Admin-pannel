"use client";

import { useState, useEffect } from "react";
import {
    CreditCard, Plus, Edit2, CheckCircle, XCircle,
    Loader2, AlertCircle, Search
} from "lucide-react";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import {
    billingApi,
    BillingPlan,
    CreateBillingPlanRequest,
    UpdateBillingPlanRequest,
    BillingPlanType,
} from "@/lib/api";

export default function PlansPage() {
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Modal state
    const [createOpen, setCreateOpen] = useState(false);
    const [editPlan, setEditPlan] = useState<BillingPlan | null>(null);

    const { toast, showToast, hideToast } = useToast();

    const fetchPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await billingApi.getPlans();
            setPlans(res.data?.plans || []);
        } catch (err: any) {
            setError(err.message || "Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const filteredPlans = plans.filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q)
        );
    });

    const metrics = {
        total: plans.length,
        active: plans.filter((p) => p.is_active).length,
        perOrder: plans.filter((p) => p.type === "PER_ORDER").length,
        monthly: plans.filter((p) => p.type === "MONTHLY").length,
    };

    return (
        <div className="space-y-8 pb-10">
            <Toast toast={toast} onClose={hideToast} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Billing Plans
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Manage subscription and per-order billing plans
                    </p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-semibold"
                >
                    <Plus size={18} /> Create Plan
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: "Total Plans", value: metrics.total, icon: CreditCard, color: "text-blue-500", bg: "bg-blue-50/80" },
                    { label: "Active", value: metrics.active, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50/80" },
                    { label: "Per Order", value: metrics.perOrder, icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50/80" },
                    { label: "Monthly", value: metrics.monthly, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50/80" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0 border border-white max-sm:hidden`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                {/* Search */}
                <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search plans…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm shadow-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                            <p className="text-slate-500 font-medium">Loading plans…</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                            <p className="text-red-600 font-semibold mb-2">Failed to load plans</p>
                            <p className="text-sm text-slate-500 mb-4 max-w-sm">{error}</p>
                            <button onClick={fetchPlans} className="text-amber-600 font-semibold text-sm hover:underline">
                                Try Again
                            </button>
                        </div>
                    ) : filteredPlans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/50">
                            <CreditCard size={40} className="text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No plans found</h3>
                            <p className="text-sm font-medium text-slate-500">
                                {search ? "Try adjusting your search query." : "Create your first billing plan to get started."}
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Code</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Price</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Duration</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Default</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredPlans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                                                {plan.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={plan.description}>
                                                        {plan.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                {plan.code}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                plan.type === "PER_ORDER"
                                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                                    : "bg-purple-100 text-purple-700 border-purple-200"
                                            }`}>
                                                {plan.type === "PER_ORDER" ? "Per Order" : "Monthly"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-slate-800 text-right whitespace-nowrap">
                                            ₹{plan.price}
                                            <span className="text-xs font-medium text-slate-400 ml-1">
                                                {plan.type === "PER_ORDER" ? "/order" : "/mo"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-slate-600 text-right">
                                            {plan.duration_days > 0 ? `${plan.duration_days}d` : "—"}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                plan.is_active
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            }`}>
                                                {plan.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {plan.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {plan.is_default ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    DEFAULT
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => setEditPlan(plan)}
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                title="Edit Plan"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create Plan Modal */}
            <PlanFormModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                mode="create"
                onSuccess={() => {
                    fetchPlans();
                    showToast("Plan created successfully", "success");
                }}
                showToast={showToast}
            />

            {/* Edit Plan Modal */}
            <PlanFormModal
                isOpen={!!editPlan}
                onClose={() => setEditPlan(null)}
                mode="edit"
                plan={editPlan || undefined}
                onSuccess={() => {
                    fetchPlans();
                    showToast("Plan updated successfully", "success");
                }}
                showToast={showToast}
            />
        </div>
    );
}

// ─── Plan Form Modal (Create / Edit) ────────────────────────────────────────

interface PlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    plan?: BillingPlan;
    onSuccess: () => void;
    showToast: (message: string, type: "success" | "error") => void;
}

function PlanFormModal({ isOpen, onClose, mode, plan, onSuccess, showToast }: PlanFormModalProps) {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState<BillingPlanType>("PER_ORDER");
    const [price, setPrice] = useState("");
    const [durationDays, setDurationDays] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isDefault, setIsDefault] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && plan) {
                setCode(plan.code);
                setName(plan.name);
                setType(plan.type);
                setPrice(plan.price.toString());
                setDurationDays(plan.duration_days.toString());
                setDescription(plan.description || "");
                setIsActive(plan.is_active);
                setIsDefault(plan.is_default);
            } else {
                setCode("");
                setName("");
                setType("PER_ORDER");
                setPrice("");
                setDurationDays("");
                setDescription("");
                setIsActive(true);
                setIsDefault(false);
            }
        }
    }, [isOpen, mode, plan]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            if (mode === "create") {
                const data: CreateBillingPlanRequest = {
                    code: code.trim() || name.trim().toUpperCase().replace(/\s+/g, "_"),
                    name: name.trim(),
                    type,
                    price: parseFloat(price) || 0,
                    duration_days: parseInt(durationDays) || 0,
                    is_active: isActive,
                    is_default: isDefault,
                    description: description.trim() || undefined,
                };
                await billingApi.createPlan(data);
            } else if (plan) {
                const data: UpdateBillingPlanRequest = {
                    name: name.trim(),
                    price: parseFloat(price) || undefined,
                    duration_days: parseInt(durationDays) || undefined,
                    is_active: isActive,
                    is_default: isDefault,
                    description: description.trim() || undefined,
                };
                await billingApi.updatePlan(plan.id, data);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.message || `Failed to ${mode} plan`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Create Billing Plan" : "Edit Billing Plan"} maxWidth="lg">
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Code — only for create */}
                    {mode === "create" && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plan Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g. MONTHLY_800"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plan Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Monthly Basic"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plan Type *</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as BillingPlanType)}
                            disabled={mode === "edit"}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option value="PER_ORDER">Per Order</option>
                            <option value="MONTHLY">Monthly</option>
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (₹) *</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            step="1"
                            placeholder="e.g. 800"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (days)</label>
                        <input
                            type="number"
                            value={durationDays}
                            onChange={(e) => setDurationDays(e.target.value)}
                            min="0"
                            placeholder="e.g. 30"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Plan description…"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                    />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Default Plan</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || submitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {mode === "create" ? "Create Plan" : "Save Changes"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
