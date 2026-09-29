"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
    ActivityFilter,
    UserAnalytics,
    listUserAnalytics,
} from "@/services/userAnalyticsService";

const ACTIVITY_OPTIONS: { value: ActivityFilter; label: string }[] = [
    { value: "", label: "All users" },
    { value: "active_today", label: "Active today" },
    { value: "active_7d", label: "Active last 7 days" },
    { value: "inactive_7d", label: "Inactive 7+ days" },
    { value: "inactive_30d", label: "Inactive 30+ days" },
    { value: "inactive_60d", label: "Inactive 60+ days" },
    { value: "inactive_90d", label: "Inactive 90+ days" },
    { value: "new_users", label: "New users (≤1 order)" },
    { value: "returning_users", label: "Returning users (2+ orders)" },
    { value: "has_orders", label: "Users with orders" },
    { value: "no_orders", label: "Users without orders" },
    { value: "profit_generating", label: "Profit-generating" },
    { value: "loss_making", label: "Loss-making" },
];

const money = (v: number) => `₹${v.toFixed(2)}`;
const dateStr = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

/**
 * Complete User Analytics (platform upgrade Module 8).
 *
 * Two honest gaps, shown rather than hidden: (1) "Refunded orders"/"Total
 * refunds" are always 0 — no refund tracking exists anywhere in this
 * platform yet. (2) Fee/markup/discount/profit fields only cover ONLINE
 * orders (order_pricing_snapshots, Module 1) — a user whose orders are all
 * POS/QR shows "no pricing data" rather than a misleading zero.
 */
export default function UserAnalyticsPage() {
    const [search, setSearch] = useState("");
    const [activity, setActivity] = useState<ActivityFilter>("");
    const [registeredFrom, setRegisteredFrom] = useState("");
    const [registeredTo, setRegisteredTo] = useState("");
    const [page, setPage] = useState(1);

    const [users, setUsers] = useState<UserAnalytics[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listUserAnalytics({
                search: search.trim() || undefined,
                activity: activity || undefined,
                registeredFrom: registeredFrom ? new Date(registeredFrom).toISOString() : undefined,
                registeredTo: registeredTo ? new Date(registeredTo).toISOString() : undefined,
                page,
                limit: 20,
            });
            setUsers(res.users);
            setHasMore(res.has_more);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load user analytics");
        } finally {
            setLoading(false);
        }
         
    }, [search, activity, registeredFrom, registeredTo, page]);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">User Analytics</h1>
                    <p className="text-sm text-gray-500">
                        Refunds are not tracked yet (always 0). Fee/markup/profit figures only
                        cover online orders — a user whose orders are all POS/QR shows
                        &quot;no pricing data&quot;.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="rounded-lg border p-4 grid gap-3 md:grid-cols-5">
                <input
                    className="rounded-md border px-3 py-2 text-sm"
                    placeholder="Search name or phone"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
                <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={activity}
                    onChange={(e) => {
                        setActivity(e.target.value as ActivityFilter);
                        setPage(1);
                    }}
                >
                    {ACTIVITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    className="rounded-md border px-3 py-2 text-sm"
                    value={registeredFrom}
                    onChange={(e) => {
                        setRegisteredFrom(e.target.value);
                        setPage(1);
                    }}
                    title="Registered from"
                />
                <input
                    type="date"
                    className="rounded-md border px-3 py-2 text-sm"
                    value={registeredTo}
                    onChange={(e) => {
                        setRegisteredTo(e.target.value);
                        setPage(1);
                    }}
                    title="Registered to"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
            ) : users.length === 0 ? (
                <p className="text-sm text-gray-500">No users match this filter.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2" />
                                <th className="px-3 py-2">User</th>
                                <th className="px-3 py-2">Registered</th>
                                <th className="px-3 py-2">Last active</th>
                                <th className="px-3 py-2">Orders</th>
                                <th className="px-3 py-2">GMV</th>
                                <th className="px-3 py-2">AOV</th>
                                <th className="px-3 py-2">Est. profit/loss</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <UserRow
                                    key={u.user_id}
                                    user={u}
                                    expanded={expanded === u.user_id}
                                    onToggle={() => setExpanded(expanded === u.user_id ? null : u.user_id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-500">Page {page}</span>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function UserRow({
    user,
    expanded,
    onToggle,
}: {
    user: UserAnalytics;
    expanded: boolean;
    onToggle: () => void;
}) {
    const profitColor =
        !user.has_pricing_data
            ? "text-gray-400"
            : user.estimated_net_profit_loss > 0
              ? "text-emerald-600"
              : user.estimated_net_profit_loss < 0
                ? "text-red-600"
                : "text-gray-600";

    return (
        <>
            <tr className="border-t cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <td className="px-3 py-2">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </td>
                <td className="px-3 py-2">
                    <div className="font-medium">{user.name || "(no name)"}</div>
                    <div className="text-xs text-gray-500">{user.phone || "—"}</div>
                </td>
                <td className="px-3 py-2">{dateStr(user.registered_at)}</td>
                <td className="px-3 py-2">{dateStr(user.last_active_at)}</td>
                <td className="px-3 py-2">
                    {user.total_orders}{" "}
                    <span className="text-xs text-gray-500">
                        ({user.completed_orders} done, {user.cancelled_orders} cancelled)
                    </span>
                </td>
                <td className="px-3 py-2">{money(user.total_gmv)}</td>
                <td className="px-3 py-2">{money(user.average_order_value)}</td>
                <td className={`px-3 py-2 font-medium ${profitColor}`}>
                    {user.has_pricing_data ? money(user.estimated_net_profit_loss) : "no pricing data"}
                </td>
            </tr>
            {expanded && (
                <tr className="border-t bg-gray-50">
                    <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <Stat label="User ID" value={user.user_id} mono />
                            <Stat label="Last login" value={dateStr(user.last_login_at)} />
                            <Stat label="Last order" value={dateStr(user.last_order_at)} />
                            <Stat label="Total sessions" value={String(user.total_sessions)} />
                            <Stat label="Total active days" value={String(user.total_active_days)} />
                            <Stat label="Refunded orders" value={`${user.refunded_orders} (not tracked)`} />
                            <Stat label="Total refunds" value={`${money(user.total_refunds)} (not tracked)`} />
                            <Stat label="" value="" />
                            <Stat label="Delivery fees paid" value={money(user.total_delivery_fees_paid)} />
                            <Stat label="Platform fees paid" value={money(user.total_platform_fees_paid)} />
                            <Stat label="Markup paid" value={money(user.total_markup_paid)} />
                            <Stat label="Discount received" value={money(user.total_discount_received)} />
                            <Stat label="Coupon benefit" value={money(user.total_coupon_benefit)} />
                            <Stat label="Referral benefit" value={money(user.total_referral_benefit)} />
                            <Stat label="Platform revenue generated" value={money(user.total_platform_revenue_generated)} />
                            <Stat
                                label="Estimated net profit/loss"
                                value={user.has_pricing_data ? money(user.estimated_net_profit_loss) : "no pricing data"}
                            />
                        </div>
                        {!user.has_pricing_data && (
                            <p className="mt-3 text-xs text-gray-500">
                                This user has no online-order pricing snapshot (orders are POS/QR, or none
                                placed yet), so fee/markup/discount/profit figures above are not meaningful.
                            </p>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    if (!label) return <div />;
    return (
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
        </div>
    );
}
