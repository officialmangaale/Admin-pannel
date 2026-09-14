"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Loader2, MapPin, XCircle } from "lucide-react";
import { groceryAdminApi, GroceryMerchantDetail } from "@/lib/api";
import GroceryStatusBadge from "@/components/grocery/GroceryStatusBadge";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const DOCUMENT_LABELS: Record<string, string> = {
    gst: "GST certificate",
    fssai: "FSSAI licence",
    pan: "PAN card",
    shop_license: "Shop licence",
    bank_proof: "Bank proof",
};

const MAX_REASON = 500;

function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : format(date, "d MMM yyyy, h:mm a");
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
    const text = value === undefined || value === null || value === "" ? "—" : String(value);
    return (
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-slate-800 mt-1 break-words">{text}</p>
        </div>
    );
}

export default function GroceryShopDetailPage() {
    const params = useParams();
    const merchantId = Number(params.id);
    const [merchant, setMerchant] = useState<GroceryMerchantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmApprove, setConfirmApprove] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    const load = useCallback(async () => {
        if (!Number.isFinite(merchantId) || merchantId <= 0) {
            setError("Invalid shop id");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            setMerchant(await groceryAdminApi.get(merchantId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load the shop");
        } finally {
            setLoading(false);
        }
    }, [merchantId]);

    useEffect(() => {
        load();
    }, [load]);

    const approve = async () => {
        setSubmitting(true);
        try {
            setMerchant(await groceryAdminApi.approve(merchantId));
            setConfirmApprove(false);
            showToast("Shop approved. The shopkeeper can now open it.", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Approval failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const reject = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            showToast("Enter a reason the shopkeeper can act on.", "warning");
            return;
        }
        setSubmitting(true);
        try {
            setMerchant(await groceryAdminApi.reject(merchantId, trimmed));
            setRejectOpen(false);
            setReason("");
            showToast("Shop rejected.", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Rejection failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-sm font-medium">Loading shop…</p>
            </div>
        );
    }

    if (error || !merchant) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <AlertCircle className="text-red-500" size={32} />
                <p className="text-sm font-semibold text-slate-800">Could not load this shop</p>
                <p className="text-sm text-slate-500">{error}</p>
                <div className="flex gap-2 mt-2">
                    <Link href="/grocery-shops" className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold">
                        Back to list
                    </Link>
                    <button onClick={load} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const canApproveStatus = merchant.status === "pending_approval" || merchant.status === "rejected";
    const canReject = merchant.status === "pending_approval" || merchant.status === "rejected";

    return (
        <div className="space-y-6 pb-10">
            <Toast toast={toast} onClose={hideToast} />

            <Link href="/grocery-shops" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
                <ArrowLeft size={16} /> Grocery shops
            </Link>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-slate-900">{merchant.name}</h1>
                        <GroceryStatusBadge status={merchant.status} />
                        {merchant.status === "active" && (
                            <span className="text-xs font-semibold text-slate-500">{merchant.is_open ? "Open" : "Closed"}</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Submitted {formatDate(merchant.created_at)}
                        {merchant.approved_at ? ` · Approved ${formatDate(merchant.approved_at)}` : ""}
                    </p>
                </div>
                {(canApproveStatus || canReject) && (
                    <div className="flex flex-col items-stretch lg:items-end gap-2">
                        <div className="flex gap-2">
                            {canReject && (
                                <button
                                    onClick={() => setRejectOpen(true)}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 bg-red-50 rounded-xl font-semibold text-sm hover:bg-red-100 disabled:opacity-50"
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                            )}
                            {canApproveStatus && (
                                <button
                                    onClick={() => setConfirmApprove(true)}
                                    disabled={submitting || !merchant.can_approve}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                            )}
                        </div>
                        {canApproveStatus && !merchant.can_approve && (
                            <p className="text-xs text-red-600">
                                A store location, address and delivery radius are required before approval.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {merchant.status === "rejected" && merchant.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">
                    <span className="font-semibold">Rejection reason: </span>
                    {merchant.rejection_reason}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-4">
                    <h2 className="font-bold text-slate-900">Shop</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Category" value={merchant.business_category} />
                        <Field label="Minimum order" value={`₹${merchant.min_order_value}`} />
                        <Field label="Owner" value={merchant.owner_name} />
                        <Field label="Phone" value={merchant.phone_masked} />
                        <Field label="GST" value={merchant.gst_number} />
                        <Field label="FSSAI" value={merchant.fssai_number} />
                    </div>
                    <Field label="Description" value={merchant.description} />
                </section>

                <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-4">
                    <h2 className="font-bold text-slate-900">Address and delivery</h2>
                    <Field label="Address" value={merchant.address} />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Landmark" value={merchant.landmark} />
                        <Field label="City" value={merchant.city} />
                        <Field label="State" value={merchant.state} />
                        <Field label="PIN code" value={merchant.postal_code} />
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-semibold ${merchant.location.captured ? "text-emerald-600" : "text-red-600"}`}>
                        <MapPin size={16} />
                        {merchant.location.captured
                            ? `Location captured · ${merchant.location.delivery_radius_km} km delivery radius`
                            : "Store location missing"}
                    </div>
                </section>
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                <h2 className="font-bold text-slate-900 p-6 pb-4">Documents</h2>
                {merchant.documents.length === 0 ? (
                    <p className="px-6 pb-6 text-sm text-slate-500">No documents uploaded.</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-y border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Document</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Uploaded</th>
                                <th className="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {merchant.documents.map((doc) => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-800">
                                        {DOCUMENT_LABELS[doc.document_type] ?? doc.document_type}
                                    </td>
                                    <td className="px-6 py-3 text-sm capitalize text-slate-600">{doc.status}</td>
                                    <td className="px-6 py-3 text-sm text-slate-500">{formatDate(doc.uploaded_at)}</td>
                                    <td className="px-6 py-3 text-right">
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800"
                                        >
                                            <FileText size={14} /> View
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <Modal isOpen={confirmApprove} onClose={() => !submitting && setConfirmApprove(false)} title="Approve this shop?">
                <p className="text-sm text-slate-600">
                    {merchant.name} will be approved. Approval does not open the shop: products become visible to nearby
                    customers once the shopkeeper opens it from the app.
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setConfirmApprove(false)} disabled={submitting} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold">
                        Cancel
                    </button>
                    <button onClick={approve} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                        {submitting && <Loader2 size={14} className="animate-spin" />} Approve
                    </button>
                </div>
            </Modal>

            <Modal isOpen={rejectOpen} onClose={() => !submitting && setRejectOpen(false)} title="Reject this shop">
                <label htmlFor="rejection-reason" className="text-sm font-semibold text-slate-700">
                    Reason (shown to the shopkeeper)
                </label>
                <textarea
                    id="rejection-reason"
                    value={reason}
                    maxLength={MAX_REASON}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    className="mt-2 w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                    placeholder="For example: the GST certificate is unreadable, please upload a clear copy."
                />
                <p className="text-xs text-slate-400 text-right">
                    {reason.length}/{MAX_REASON}
                </p>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setRejectOpen(false)} disabled={submitting} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold">
                        Cancel
                    </button>
                    <button
                        onClick={reject}
                        disabled={submitting || reason.trim().length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />} Reject shop
                    </button>
                </div>
            </Modal>
        </div>
    );
}
