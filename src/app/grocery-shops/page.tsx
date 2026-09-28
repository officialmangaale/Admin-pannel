"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, MapPin, RefreshCw, Search, ShoppingBasket } from "lucide-react";
import { groceryAdminApi, GroceryMerchantSummary } from "@/lib/api";
import GroceryStatusBadge from "@/components/grocery/GroceryStatusBadge";

const STATUS_TABS = [
    { value: "pending_approval", label: "Pending" },
    { value: "active", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
];

const PAGE_SIZE = 20;

function formatDate(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : format(date, "d MMM yyyy");
}

export default function GroceryShopsPage() {
    const router = useRouter();
    const [status, setStatus] = useState("pending_approval");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [merchants, setMerchants] = useState<GroceryMerchantSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await groceryAdminApi.list({
                status,
                q: search.trim() || undefined,
                page,
                limit: PAGE_SIZE,
            });
            setMerchants(result.merchants ?? []);
            setTotal(result.meta?.total ?? 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load grocery shops");
            setMerchants([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [status, search, page]);

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Grocery Shops
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Review shopkeeper registrations before their products reach customers
                    </p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-semibold"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50/30">
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setStatus(tab.value);
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    status === tab.value
                                        ? "bg-slate-900 text-white"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search shop, owner, city or PIN"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                        <p className="text-sm font-medium">Loading grocery shops…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                        <AlertCircle className="text-red-500" size={32} />
                        <p className="text-sm font-semibold text-slate-800">Could not load grocery shops</p>
                        <p className="text-sm text-slate-500">{error}</p>
                        <button onClick={load} className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">
                            Try again
                        </button>
                    </div>
                ) : merchants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                        <ShoppingBasket className="text-slate-300" size={40} />
                        <p className="text-sm font-semibold text-slate-800">
                            {status === "pending_approval" ? "No shops are waiting for approval" : "No grocery shops found"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Shop</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">City / PIN</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Documents</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {merchants.map((merchant) => (
                                    <tr
                                        key={merchant.grocery_merchant_id}
                                        onClick={() => router.push(`/grocery-shops/${merchant.grocery_merchant_id}`)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-900">{merchant.name}</p>
                                            <p className="text-xs text-slate-500">{merchant.business_category || "—"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{merchant.owner_name || "—"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {merchant.city || "—"}
                                            <span className="text-slate-400"> · {merchant.postal_code || "—"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <GroceryStatusBadge status={merchant.status} />
                                                {merchant.status === "active" && (
                                                    <span className="text-xs text-slate-500">{merchant.is_open ? "Open" : "Closed"}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {merchant.documents.total === 0
                                                ? "None"
                                                : `${merchant.documents.pending} pending · ${merchant.documents.verified} verified`}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center gap-1 ${merchant.has_valid_store ? "text-emerald-600" : "text-red-600"}`}>
                                                <MapPin size={14} />
                                                {merchant.has_valid_store ? "Captured" : "Missing"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(merchant.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && total > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                        <span>
                            Page {page} of {totalPages} · {total} shops
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((current) => current - 1)}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((current) => current + 1)}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"
                                aria-label="Next page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
