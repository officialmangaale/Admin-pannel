"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { restaurantApi, Restaurant, orderApi, Order } from "@/lib/api";
import { Loader2, ArrowLeft, Building2, Wallet as WalletIcon, Receipt, History, AlertCircle, ShoppingBag, Settings, User as UserIcon, RefreshCw, Phone, Mail, MapPin } from "lucide-react";

export default function RestaurantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "orders" | "wallet" | "history">("overview");

    const fetchDetails = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch restaurant details
            const resData = await restaurantApi.getById(parseInt(id));
            if (resData?.data) {
                setRestaurant(resData.data);
            }
            
            // Optionally try to fetch orders if on orders tab
            if (activeTab === "orders" && orders.length === 0) {
                const ordersData = await orderApi.getAll({ restaurant_id: id, limit: 10 });
                if (ordersData?.data?.orders) {
                    setOrders(ordersData.data.orders);
                }
            }
            
        } catch (err: any) {
            setError(err.message || "Failed to load restaurant details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id, activeTab]);

    if (loading && !restaurant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
                <p className="text-gray-500">Loading restaurant details...</p>
            </div>
        );
    }

    if (error && !restaurant) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center min-h-[40vh] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-white text-gray-700 border rounded-lg hover:bg-gray-50"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={fetchDetails}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!restaurant) return null;

    const tabs = [
        { id: "overview", label: "Overview", icon: Building2 },
        { id: "orders", label: "Orders", icon: ShoppingBag },
        { id: "wallet", label: "Wallet & Billing", icon: WalletIcon },
        { id: "history", label: "Activity History", icon: History },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.push('/restaurants')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            restaurant.status === "active" ? "bg-green-100 text-green-700" :
                            restaurant.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                        }`}>
                            {restaurant.status.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <MapPin size={14} /> {restaurant.street_address}, {restaurant.city}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchDetails}
                        className="p-2 text-gray-500 bg-white border rounded-lg hover:bg-gray-50"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center gap-2">
                        <Settings size={18} /> Settings
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 -mb-px overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                    isActive
                                        ? "border-yellow-500 text-yellow-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Owner & Registration */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                                    <UserIcon size={18} className="text-gray-400" />
                                    Owner Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Name</span>
                                        <span className="font-medium text-gray-900">{restaurant.owner_name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phone</span>
                                        <span className="font-medium text-gray-900 flex items-center gap-1">
                                            {restaurant.phone || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Auth User ID</span>
                                        <span className="font-medium text-gray-900">{restaurant.owner_auth_user_id || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Building2 size={18} className="text-gray-400" />
                                    Registration Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Category</span>
                                        <span className="font-medium text-gray-900">{restaurant.category || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-medium text-gray-900">{restaurant.type || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">GST Number</span>
                                        <span className="font-medium text-gray-900">{restaurant.gst_number || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">FSSAI Number</span>
                                        <span className="font-medium text-gray-900">{restaurant.fssai_number || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Registered on App</span>
                                        <span className="font-medium text-gray-900">
                                            {restaurant.is_restaurant_registered ? "Yes" : "No"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Qrunch & Config */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Receipt size={18} className="text-gray-400" />
                                    Qrunch Configuration
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Qrunch Reqeusted</span>
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                                            restaurant.is_qrunch_requested ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-gray-50 text-gray-600 border-gray-200"
                                        }`}>
                                            {restaurant.is_qrunch_requested ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Qrunch Purchased</span>
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                                            restaurant.is_qrunch_purchased ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                                        }`}>
                                            {restaurant.is_qrunch_purchased ? "Yes" : "No"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                                    <WalletIcon size={18} className="text-gray-400" />
                                    Wallet Status
                                </h3>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Current Balance</p>
                                        <p className={`text-2xl font-bold ${
                                            (restaurant.wallet_amount || 0) < 0 ? "text-red-600" : 
                                            (restaurant.wallet_amount || 0) > 0 ? "text-green-600" : "text-gray-900"
                                        }`}>
                                            ₹{restaurant.wallet_amount?.toFixed(2) || "0.00"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">UPI VPA</p>
                                        <p className="font-medium text-gray-900">{restaurant.upi_vpa || "Not Setup"}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Dates</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created At</span>
                                        <span className="font-medium text-gray-900">
                                            {restaurant.created_at ? new Date(restaurant.created_at).toLocaleString() : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Last Updated</span>
                                        <span className="font-medium text-gray-900">
                                            {restaurant.updated_at ? new Date(restaurant.updated_at).toLocaleString() : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "orders" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                            {/* In a real scenario, could add filters here */}
                        </div>

                        {loading && orders.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map((order) => (
                                            <tr key={order.order_id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm font-medium text-gray-900">#{order.order_number || order.order_id}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    {order.is_qrunch ? (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">Qrunch</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{order.order_type || "Standard"}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium">₹{order.total_amount?.toFixed(2)}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                        order.order_status === "delivered" ? "bg-green-100 text-green-700" :
                                                        order.order_status === "cancelled" ? "bg-red-100 text-red-700" :
                                                        "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                        {order.order_status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                <ShoppingBag className="w-12 h-12 text-gray-300 mb-2" />
                                <h4 className="text-gray-900 font-medium">No Orders Found</h4>
                                <p className="text-sm text-gray-500 mt-1">This restaurant hasn't received any orders yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "wallet" && (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <WalletIcon className="w-12 h-12 text-gray-300 mb-4" />
                        <h4 className="text-gray-900 font-medium text-lg">Detailed Wallet History Coming Soon</h4>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm">
                            The detailed settlement logs and transaction history for `{restaurant.name}` will be available here when the backend API is ready.
                        </p>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <History className="w-12 h-12 text-gray-300 mb-4" />
                        <h4 className="text-gray-900 font-medium text-lg">Activity Logs Coming Soon</h4>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm">
                            Administrative actions, status changes, and operational logs will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
