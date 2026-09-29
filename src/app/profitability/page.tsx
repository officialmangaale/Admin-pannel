"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import {
    OrderFinancialBreakdown,
    OrderProfitability,
    ProfitabilityDimension,
    ProfitabilityRow,
    getOrderFinancialBreakdown,
    getOrderProfitability,
    getProfitabilityRollup,
} from "@/services/profitabilityService";

const DIMENSIONS: { value: ProfitabilityDimension; label: string }[] = [
    { value: "restaurant", label: "By restaurant" },
    { value: "rider", label: "By rider" },
    { value: "day", label: "By day" },
    { value: "week", label: "By week" },
    { value: "month", label: "By month" },
    { value: "location", label: "By location (restaurant city)" },
];

const money = (v: number) => `₹${v.toFixed(2)}`;

/**
 * User Profitability Analytics (platform upgrade Module 9).
 *
 * Two honest gaps carried over from Module 8: refund cost is always 0 (no
 * refund tracking exists), and only online orders with a pricing snapshot
 * are included (POS/QR orders have none). "Promotional subsidy" is this
 * order's offer/spin-reward discount, not a Module 7 referral payout —
 * that system is a separate ledger and ships disabled everywhere.
 */
export default function ProfitabilityPage() {
    const [dimension, setDimension] = useState<ProfitabilityDimension>("restaurant");
    const [restaurantId, setRestaurantId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [rows, setRows] = useState<ProfitabilityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [orderIdInput, setOrderIdInput] = useState("");
    const [orderDetail, setOrderDetail] = useState<OrderProfitability | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderLoading, setOrderLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProfitabilityRollup({
                dimension,
                restaurantId: restaurantId ? Number(restaurantId) : undefined,
                dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
                dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
            });
            setRows(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load profitability data");
        } finally {
            setLoading(false);
        }
         
    }, [dimension, restaurantId, dateFrom, dateTo]);

    useEffect(() => {
        void load();
    }, [load]);

    const lookupOrder = async () => {
        const id = Number(orderIdInput);
        if (!id) return;
        setOrderLoading(true);
        setOrderError(null);
        setOrderDetail(null);
        try {
            setOrderDetail(await getOrderProfitability(id));
        } catch (err) {
            setOrderError(err instanceof Error ? err.message : "Could not load this order");
        } finally {
            setOrderLoading(false);
        }
    };

    const totals = rows.reduce(
        (acc, r) => ({
            orders: acc.orders + r.order_count,
            revenue: acc.revenue + r.platform_revenue,
            netProfitLoss: acc.netProfitLoss + r.net_profit_loss,
        }),
        { orders: 0, revenue: 0, netProfitLoss: 0 }
    );

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Profitability</h1>
                <p className="text-sm text-gray-500">
                    Only online orders with a pricing snapshot are included (POS/QR orders have
                    none). Refund cost is always 0 — not tracked yet.
                </p>
            </div>

            {/* ── Order-level lookup ── */}
            <div className="rounded-lg border p-4 space-y-3">
                <h2 className="font-medium">Look up one order</h2>
                <div className="flex items-center gap-2">
                    <input
                        className="w-40 rounded-md border px-3 py-2 text-sm"
                        placeholder="Order ID"
                        value={orderIdInput}
                        onChange={(e) => setOrderIdInput(e.target.value.replace(/[^0-9]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && void lookupOrder()}
                    />
                    <button
                        onClick={() => void lookupOrder()}
                        disabled={orderLoading || !orderIdInput}
                        className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {orderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Look up
                    </button>
                </div>
                {orderError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {orderError}
                    </div>
                )}
                {orderDetail && <OrderProfitabilityCard order={orderDetail} />}
            </div>

            {/* ── Rollup ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-medium">Rollup</h2>
                    <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>

                <div className="rounded-lg border p-4 grid gap-3 md:grid-cols-4">
                    <select
                        className="rounded-md border px-3 py-2 text-sm"
                        value={dimension}
                        onChange={(e) => setDimension(e.target.value as ProfitabilityDimension)}
                    >
                        {DIMENSIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </select>
                    <input
                        className="rounded-md border px-3 py-2 text-sm"
                        placeholder="Restaurant ID (optional)"
                        value={restaurantId}
                        onChange={(e) => setRestaurantId(e.target.value.replace(/[^0-9]/g, ""))}
                    />
                    <input
                        type="date"
                        className="rounded-md border px-3 py-2 text-sm"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        title="From"
                    />
                    <input
                        type="date"
                        className="rounded-md border px-3 py-2 text-sm"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        title="To"
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
                ) : rows.length === 0 ? (
                    <p className="text-sm text-gray-500">No data for this filter.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            <SummaryCard label="Total orders" value={String(totals.orders)} />
                            <SummaryCard label="Platform revenue" value={money(totals.revenue)} />
                            <SummaryCard
                                label="Net profit/loss"
                                value={money(totals.netProfitLoss)}
                                tone={totals.netProfitLoss >= 0 ? "positive" : "negative"}
                            />
                        </div>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="px-3 py-2">Group</th>
                                        <th className="px-3 py-2">Orders</th>
                                        <th className="px-3 py-2">Commission</th>
                                        <th className="px-3 py-2">Markup</th>
                                        <th className="px-3 py-2">Platform fee</th>
                                        <th className="px-3 py-2">Delivery fee</th>
                                        <th className="px-3 py-2">Rider cost</th>
                                        <th className="px-3 py-2">Coupon subsidy</th>
                                        <th className="px-3 py-2">Platform revenue</th>
                                        <th className="px-3 py-2">Net profit/loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.group_key} className="border-t">
                                            <td className="px-3 py-2 font-medium">{r.group_label}</td>
                                            <td className="px-3 py-2">{r.order_count}</td>
                                            <td className="px-3 py-2">{money(r.restaurant_commission_revenue)}</td>
                                            <td className="px-3 py-2">{money(r.customer_markup_revenue)}</td>
                                            <td className="px-3 py-2">{money(r.platform_fee_revenue)}</td>
                                            <td className="px-3 py-2">{money(r.delivery_fee_revenue)}</td>
                                            <td className="px-3 py-2">{money(r.rider_cost)}</td>
                                            <td className="px-3 py-2">{money(r.coupon_subsidy)}</td>
                                            <td className="px-3 py-2">{money(r.platform_revenue)}</td>
                                            <td
                                                className={`px-3 py-2 font-medium ${
                                                    r.net_profit_loss >= 0 ? "text-emerald-600" : "text-red-600"
                                                }`}
                                            >
                                                {money(r.net_profit_loss)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: "positive" | "negative";
}) {
    const color = tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-gray-900";
    return (
        <div className="rounded-lg border p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`text-xl font-semibold ${color}`}>{value}</div>
        </div>
    );
}

function OrderProfitabilityCard({ order }: { order: OrderProfitability }) {
    return (
        <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <span className="font-semibold">Order #{order.order_id}</span>
                    <span className="ml-2 text-xs text-gray-500">
                        restaurant {order.restaurant_id} · {order.order_type} ·{" "}
                        {new Date(order.created_at).toLocaleString()}
                    </span>
                </div>
                <span
                    className={`rounded-md px-3 py-1 text-sm font-semibold ${
                        order.estimated_platform_profit >= 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                    }`}
                >
                    {money(order.estimated_platform_profit)}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
                <Line label="Restaurant commission revenue" value={money(order.restaurant_commission_revenue)} positive />
                <Line label="Customer markup revenue" value={money(order.customer_markup_revenue)} positive />
                <Line label="Platform fee revenue" value={money(order.platform_fee_revenue)} positive />
                <Line label="Delivery fee revenue" value={money(order.delivery_fee_revenue)} positive />
                <Line label="Rider cost" value={money(order.rider_cost)} />
                <Line label="Coupon subsidy" value={money(order.coupon_subsidy)} />
                <Line label="Promotional subsidy" value={money(order.promotional_subsidy)} />
                <Line label="Refund cost" value={`${money(order.refund_cost)} (not tracked)`} />
            </div>
            <div className="flex gap-6 border-t pt-3 text-sm">
                <div>
                    <div className="text-xs text-gray-500">Customer paid</div>
                    <div className="font-medium">{money(order.customer_final_payable)}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Restaurant settlement</div>
                    <div className="font-medium">{money(order.restaurant_settlement)}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Platform revenue</div>
                    <div className="font-medium">{money(order.platform_revenue)}</div>
                </div>
            </div>

            <FullBreakdownSection orderId={order.order_id} />
        </div>
    );
}

function FullBreakdownSection({ orderId }: { orderId: number }) {
    const [expanded, setExpanded] = useState(false);
    const [breakdown, setBreakdown] = useState<OrderFinancialBreakdown | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggle = async () => {
        if (expanded) {
            setExpanded(false);
            return;
        }
        setExpanded(true);
        if (breakdown) return;
        setLoading(true);
        setError(null);
        try {
            setBreakdown(await getOrderFinancialBreakdown(orderId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load the full breakdown");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-t pt-3">
            <button
                onClick={() => void toggle()}
                className="flex items-center gap-1 text-sm font-medium text-gray-700"
            >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                View full financial breakdown
            </button>
            {expanded && (
                <div className="mt-3">
                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    ) : breakdown ? (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                            <BreakdownGroup title="Item & tax">
                                <Line label="Base item total" value={money(breakdown.breakdown.base_item_total)} />
                                <Line label="Customer item total" value={money(breakdown.breakdown.customer_item_total)} />
                                <Line label="Markup" value={money(breakdown.breakdown.markup_amount)} />
                                <Line label="Tax (CGST+SGST)" value={money(breakdown.breakdown.tax_amount)} />
                            </BreakdownGroup>
                            <BreakdownGroup title="Fees & charges">
                                <Line label="Packaging fee" value={money(breakdown.breakdown.packaging_fee)} />
                                <Line label="Delivery fee" value={money(breakdown.breakdown.delivery_fee)} />
                                <Line label="Platform fee" value={money(breakdown.breakdown.platform_fee)} />
                                <Line label="Additional charges" value={money(breakdown.breakdown.additional_charges)} />
                                <Line label="Tip" value={money(breakdown.breakdown.tip_amount)} />
                            </BreakdownGroup>
                            <BreakdownGroup title="Discounts">
                                <Line label="Coupon discount" value={money(breakdown.breakdown.coupon_discount)} />
                                <Line label="— platform funded" value={money(breakdown.breakdown.coupon_platform_funded)} />
                                <Line label="— restaurant funded" value={money(breakdown.breakdown.coupon_restaurant_funded)} />
                                <Line label="Referral/promo discount" value={money(breakdown.breakdown.referral_discount)} />
                                <Line label="Round-off" value={money(breakdown.breakdown.round_off_amount)} />
                            </BreakdownGroup>
                            <BreakdownGroup title="Restaurant">
                                <Line label="Base revenue" value={money(breakdown.breakdown.restaurant_base_revenue)} />
                                <Line label="Commission rate" value={`${breakdown.breakdown.restaurant_commission_rate_percent}%`} />
                                <Line label="Commission" value={money(breakdown.breakdown.restaurant_commission)} />
                                <Line label="Adjustment" value={money(breakdown.breakdown.restaurant_adjustment)} />
                                <Line label="Settlement" value={money(breakdown.breakdown.restaurant_settlement)} />
                            </BreakdownGroup>
                            <BreakdownGroup title="Rider">
                                <Line label="Earning" value={money(breakdown.breakdown.rider_earning)} />
                                <Line label="Cost to platform" value={money(breakdown.breakdown.rider_cost)} />
                                <Line label="Cash collected (COD)" value={money(breakdown.breakdown.cash_collected)} />
                                <Line label="Wallet adjustment" value={money(breakdown.breakdown.rider_wallet_adjustment)} />
                            </BreakdownGroup>
                            <BreakdownGroup title="Platform">
                                <Line label="Revenue" value={money(breakdown.breakdown.platform_revenue)} />
                                <Line label="Costs" value={money(breakdown.breakdown.platform_costs)} />
                                <Line label="Estimated profit" value={money(breakdown.breakdown.estimated_platform_profit)} />
                            </BreakdownGroup>
                            {breakdown.breakdown.applied_fees && breakdown.breakdown.applied_fees.length > 0 && (
                                <BreakdownGroup title="Applied fees">
                                    {breakdown.breakdown.applied_fees.map((f, i) => (
                                        <Line key={i} label={f.name} value={money(f.amount)} />
                                    ))}
                                </BreakdownGroup>
                            )}
                            <div className="col-span-full text-xs text-gray-400">
                                Pricing engine v{breakdown.engine_version} · snapshot at{" "}
                                {new Date(breakdown.created_at).toLocaleString()}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function BreakdownGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-xs font-semibold uppercase text-gray-400 mb-1">{title}</div>
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function Line({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
    return (
        <div>
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`font-medium ${positive ? "text-emerald-700" : "text-gray-800"}`}>{value}</div>
        </div>
    );
}
