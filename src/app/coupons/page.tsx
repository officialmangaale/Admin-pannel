"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BarChart3, Loader2, Plus, RefreshCw, Save } from "lucide-react";
import {
    AdminCoupon,
    AdminCouponInput,
    CouponDiscountType,
    CouponFundingSource,
    CouponUsageSummary,
    createAdminCoupon,
    getCouponUsageSummary,
    listAdminCoupons,
    setAdminCouponStatus,
    updateAdminCoupon,
} from "@/services/adminCouponService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const emptyRule: AdminCouponInput = {
    restaurant_id: 0,
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_order_value: 0,
    funding_source: "restaurant",
    is_active: true,
};

/**
 * Coupon and Promotion Management (platform upgrade Module 6), admin view.
 *
 * Extends the existing restaurant-owner coupon system (live since an
 * earlier build) rather than replacing it — an admin can manage any
 * restaurant's coupons here, with the new funding-source and
 * customer-targeting controls this module added. There is no true
 * "no owning restaurant" platform-wide coupon yet; every coupon still
 * belongs to one restaurant_id (see restaurant-service's migration 103 note
 * for why).
 */
export default function AdminCouponsPage() {
    const { toast, showToast, hideToast } = useToast();
    const [restaurantId, setRestaurantId] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<number | "new" | null>(null);
    const [newCoupon, setNewCoupon] = useState<AdminCouponInput>(emptyRule);
    const [summaries, setSummaries] = useState<Record<number, CouponUsageSummary>>({});
    const [loadingSummary, setLoadingSummary] = useState<number | null>(null);

    const scopedRestaurantId = restaurantId.trim() ? Number(restaurantId.trim()) : undefined;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listAdminCoupons(scopedRestaurantId, statusFilter || undefined);
            setCoupons(res.coupons ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load coupons");
        } finally {
            setLoading(false);
        }
         
    }, [scopedRestaurantId, statusFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    const create = async () => {
        if (!newCoupon.restaurant_id || !newCoupon.code.trim()) {
            showToast("Restaurant ID and coupon code are required", "error");
            return;
        }
        if (newCoupon.discount_type !== "free_delivery" && newCoupon.discount_value <= 0) {
            showToast("Set a discount value greater than 0", "error");
            return;
        }
        setSaving("new");
        try {
            await createAdminCoupon(newCoupon);
            setNewCoupon(emptyRule);
            showToast("Coupon created", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not create the coupon", "error");
        } finally {
            setSaving(null);
        }
    };

    const toggleActive = async (coupon: AdminCoupon) => {
        setSaving(coupon.coupon_id);
        try {
            await setAdminCouponStatus(coupon.coupon_id, !coupon.is_active);
            showToast(coupon.is_active ? "Coupon deactivated" : "Coupon activated", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not update status", "error");
        } finally {
            setSaving(null);
        }
    };

    const saveFundingAndTargeting = async (coupon: AdminCoupon, input: Partial<AdminCouponInput>) => {
        setSaving(coupon.coupon_id);
        try {
            await updateAdminCoupon(coupon.coupon_id, input);
            showToast("Coupon updated", "success");
            await load();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not save the coupon", "error");
        } finally {
            setSaving(null);
        }
    };

    const loadSummary = async (couponId: number) => {
        setLoadingSummary(couponId);
        try {
            const summary = await getCouponUsageSummary(couponId);
            setSummaries((prev) => ({ ...prev, [couponId]: summary }));
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Could not load usage summary", "error");
        } finally {
            setLoadingSummary(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <Toast toast={toast} onClose={hideToast} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Coupons</h1>
                    <p className="text-sm text-gray-500">
                        Admin can manage any restaurant&apos;s coupons here — funding source,
                        new/existing customer targeting, and payment-method conditions are new;
                        everything else extends the existing restaurant coupon system.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="rounded-lg border p-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Restaurant ID</label>
                <input
                    className="w-40 rounded-md border px-3 py-2 text-sm"
                    placeholder="All restaurants"
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
                <h2 className="font-medium">Create a coupon</h2>
                {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                )}
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Restaurant ID">
                        <input
                            type="number"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newCoupon.restaurant_id || ""}
                            onChange={(e) => setNewCoupon({ ...newCoupon, restaurant_id: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Code">
                        <input
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="SAVE20"
                            value={newCoupon.code}
                            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        />
                    </Field>
                    <Field label="Type">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newCoupon.discount_type}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value as CouponDiscountType })}
                        >
                            <option value="percentage">Percentage</option>
                            <option value="flat">Flat</option>
                            <option value="free_delivery">Free delivery</option>
                        </select>
                    </Field>
                    {newCoupon.discount_type !== "free_delivery" && (
                        <Field label={newCoupon.discount_type === "percentage" ? "Value (%)" : "Value (₹)"}>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                value={newCoupon.discount_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })}
                            />
                        </Field>
                    )}
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Min order value (₹)">
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newCoupon.min_order_value ?? 0}
                            onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Funding source">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newCoupon.funding_source}
                            onChange={(e) => setNewCoupon({ ...newCoupon, funding_source: e.target.value as CouponFundingSource })}
                        >
                            <option value="restaurant">Restaurant-funded</option>
                            <option value="platform">Platform-funded</option>
                        </select>
                    </Field>
                    <Field label="Payment method condition">
                        <select
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={newCoupon.payment_method_condition ?? ""}
                            onChange={(e) => setNewCoupon({ ...newCoupon, payment_method_condition: e.target.value || undefined })}
                        >
                            <option value="">Any</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="wallet">Wallet</option>
                            <option value="online">Online</option>
                        </select>
                    </Field>
                    <div className="flex items-end gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={newCoupon.new_customer_only ?? false}
                                onChange={(e) =>
                                    setNewCoupon({ ...newCoupon, new_customer_only: e.target.checked, existing_customer_only: false })
                                }
                            />
                            New customers only
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={newCoupon.existing_customer_only ?? false}
                                onChange={(e) =>
                                    setNewCoupon({ ...newCoupon, existing_customer_only: e.target.checked, new_customer_only: false })
                                }
                            />
                            Existing customers only
                        </label>
                    </div>
                </div>
                <button
                    onClick={() => void create()}
                    disabled={saving === "new"}
                    className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                    {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create coupon
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading coupons…
                </div>
            ) : coupons.length === 0 ? (
                <p className="text-sm text-gray-500">No coupons match this filter.</p>
            ) : (
                <div className="space-y-3">
                    {coupons.map((coupon) => (
                        <CouponCard
                            key={coupon.coupon_id}
                            coupon={coupon}
                            saving={saving === coupon.coupon_id}
                            loadingSummary={loadingSummary === coupon.coupon_id}
                            summary={summaries[coupon.coupon_id]}
                            onToggleActive={() => void toggleActive(coupon)}
                            onSave={(input) => void saveFundingAndTargeting(coupon, input)}
                            onLoadSummary={() => void loadSummary(coupon.coupon_id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">{label}</label>
            {children}
        </div>
    );
}

function CouponCard({
    coupon,
    saving,
    loadingSummary,
    summary,
    onToggleActive,
    onSave,
    onLoadSummary,
}: {
    coupon: AdminCoupon;
    saving: boolean;
    loadingSummary: boolean;
    summary?: CouponUsageSummary;
    onToggleActive: () => void;
    onSave: (input: Partial<AdminCouponInput>) => void;
    onLoadSummary: () => void;
}) {
    const [fundingSource, setFundingSource] = useState<CouponFundingSource>(coupon.funding_source);
    const [newOnly, setNewOnly] = useState(coupon.new_customer_only);
    const [existingOnly, setExistingOnly] = useState(coupon.existing_customer_only);
    const [paymentMethod, setPaymentMethod] = useState(coupon.payment_method_condition ?? "");

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <span className="font-mono font-semibold">{coupon.code}</span>
                    <span className="ml-2 text-xs text-gray-500">
                        restaurant {coupon.restaurant_id} · {coupon.discount_type}
                        {coupon.discount_type !== "free_delivery" &&
                            ` ${coupon.discount_value}${coupon.discount_type === "percentage" ? "%" : ""}`}
                    </span>
                </div>
                <button
                    onClick={onToggleActive}
                    disabled={saving}
                    className={`rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                        coupon.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                >
                    {coupon.is_active ? "Active" : "Inactive"}
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-4 items-end">
                <Field label="Funding source">
                    <select
                        className="w-full rounded-md border px-2 py-1 text-sm"
                        value={fundingSource}
                        onChange={(e) => setFundingSource(e.target.value as CouponFundingSource)}
                    >
                        <option value="restaurant">Restaurant-funded</option>
                        <option value="platform">Platform-funded</option>
                    </select>
                </Field>
                <Field label="Payment method">
                    <select
                        className="w-full rounded-md border px-2 py-1 text-sm"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <option value="">Any</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="wallet">Wallet</option>
                        <option value="online">Online</option>
                    </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={newOnly}
                        onChange={(e) => {
                            setNewOnly(e.target.checked);
                            if (e.target.checked) setExistingOnly(false);
                        }}
                    />
                    New only
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={existingOnly}
                        onChange={(e) => {
                            setExistingOnly(e.target.checked);
                            if (e.target.checked) setNewOnly(false);
                        }}
                    />
                    Existing only
                </label>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() =>
                        onSave({
                            funding_source: fundingSource,
                            new_customer_only: newOnly,
                            existing_customer_only: existingOnly,
                            payment_method_condition: paymentMethod,
                        })
                    }
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                </button>
                <button
                    onClick={onLoadSummary}
                    disabled={loadingSummary}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs disabled:opacity-50"
                >
                    {loadingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
                    Usage summary
                </button>
            </div>

            {summary && (
                <div className="grid grid-cols-2 gap-2 rounded-md bg-gray-50 p-3 text-xs md:grid-cols-4">
                    <div>
                        <div className="text-gray-500">Redemptions</div>
                        <div className="font-semibold">{summary.total_redemptions}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Total discount</div>
                        <div className="font-semibold">₹{summary.total_discount_amount.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Platform-funded</div>
                        <div className="font-semibold">₹{summary.platform_funded_total.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Restaurant-funded</div>
                        <div className="font-semibold">₹{summary.restaurant_funded_total.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Failed attempts</div>
                        <div className="font-semibold">{summary.failed_attempts}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Expired</div>
                        <div className="font-semibold">{summary.is_expired ? "Yes" : "No"}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
