"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { downloadReportCSV, REPORTS, ReportField } from "@/services/reportsService";

/**
 * Admin Reports and Exports (platform upgrade Module 24). Every report here
 * downloads a CSV built from an existing, already-computed backend query
 * (restaurant-service or rider-service) — this page only collects filters
 * and triggers the download; no report math happens in the browser.
 */
export default function ReportsPage() {
    const [reportId, setReportId] = useState(REPORTS[0].id);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [restaurantId, setRestaurantId] = useState("");
    const [status, setStatus] = useState("");
    const [couponId, setCouponId] = useState("");
    const [riderId, setRiderId] = useState("");
    const [dimension, setDimension] = useState("day");
    const [search, setSearch] = useState("");
    const [activity, setActivity] = useState("");
    const [programType, setProgramType] = useState("");
    const [beneficiaryId, setBeneficiaryId] = useState("");

    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const report = useMemo(() => REPORTS.find((r) => r.id === reportId) ?? REPORTS[0], [reportId]);

    const has = (field: ReportField) => report.fields.includes(field);

    const handleDownload = async () => {
        setDownloading(true);
        setError(null);
        setSuccess(null);
        try {
            await downloadReportCSV(report, {
                from: has("date_range") ? dateFrom || undefined : undefined,
                to: has("date_range") ? dateTo || undefined : undefined,
                restaurant_id: has("restaurant_id") ? restaurantId || undefined : undefined,
                status: has("status") ? status || undefined : undefined,
                coupon_id: has("coupon_id") ? couponId || undefined : undefined,
                rider_id: has("rider_id") ? riderId || undefined : undefined,
                dimension: has("dimension") ? dimension || undefined : undefined,
                search: has("search") ? search || undefined : undefined,
                activity: has("activity") ? activity || undefined : undefined,
                program_type: has("program_type") ? programType || undefined : undefined,
                beneficiary_entity_id: has("beneficiary_entity_id") ? beneficiaryId || undefined : undefined,
            });
            setSuccess("Report downloaded.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not download this report");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-semibold">Reports</h1>
                <p className="text-sm text-gray-500">
                    Export platform data as CSV. Every export reads the same figures the rest of the admin panel
                    already shows — nothing here is recalculated.
                </p>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Report</label>
                    <select
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        value={reportId}
                        onChange={(e) => {
                            setReportId(e.target.value);
                            setSuccess(null);
                            setError(null);
                        }}
                    >
                        {REPORTS.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">{report.description}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    {has("date_range") && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                            <p className="md:col-span-2 -mt-2 text-xs text-gray-400">
                                Leave blank for the default window (last 30 days).
                            </p>
                        </>
                    )}

                    {has("restaurant_id") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Restaurant ID</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="All restaurants"
                                value={restaurantId}
                                onChange={(e) => setRestaurantId(e.target.value)}
                            />
                        </div>
                    )}

                    {has("status") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Order Status</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="All statuses"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            />
                        </div>
                    )}

                    {has("coupon_id") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Coupon ID</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="All coupons"
                                value={couponId}
                                onChange={(e) => setCouponId(e.target.value)}
                            />
                        </div>
                    )}

                    {has("rider_id") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Rider ID</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="All riders"
                                value={riderId}
                                onChange={(e) => setRiderId(e.target.value)}
                            />
                        </div>
                    )}

                    {has("dimension") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Group By</label>
                            <select
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={dimension}
                                onChange={(e) => setDimension(e.target.value)}
                            >
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="restaurant">Restaurant</option>
                                <option value="rider">Rider</option>
                                <option value="location">Location</option>
                            </select>
                        </div>
                    )}

                    {has("search") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Search (name or phone)</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="All users"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}

                    {has("activity") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Activity</label>
                            <select
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={activity}
                                onChange={(e) => setActivity(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="new_users">New users</option>
                                <option value="returning_users">Returning users</option>
                                <option value="has_orders">Has orders</option>
                                <option value="no_orders">No orders</option>
                                <option value="profit_generating">Profit generating</option>
                                <option value="loss_making">Loss making</option>
                                <option value="inactive_30d">Inactive 30d</option>
                                <option value="inactive_90d">Inactive 90d</option>
                            </select>
                        </div>
                    )}

                    {has("program_type") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Programme</label>
                            <select
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={programType}
                                onChange={(e) => setProgramType(e.target.value)}
                            >
                                <option value="">All programmes</option>
                                <option value="customer_referral">Customer</option>
                                <option value="restaurant_referral">Restaurant</option>
                                <option value="rider_referral">Rider</option>
                            </select>
                        </div>
                    )}

                    {has("beneficiary_entity_id") && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Beneficiary ID</label>
                            <input
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="All beneficiaries"
                                value={beneficiaryId}
                                onChange={(e) => setBeneficiaryId(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> {success}
                    </div>
                )}

                <button
                    onClick={() => void handleDownload()}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download CSV
                </button>
            </div>
        </div>
    );
}
