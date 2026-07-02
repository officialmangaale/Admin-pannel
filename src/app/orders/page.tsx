"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    Eye, Package, Truck, ChefHat, CheckCircle, XCircle, Clock,
    Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    X, RefreshCw, Download, Receipt, Calendar, QrCode, Activity, Phone, MapPin, UserCheck
} from "lucide-react";
import Modal from "@/components/Modal";
import { orderApi, Order, OrderFilters, OrderStatus, OrderDetails } from "@/lib/api";

const ORDER_STATUSES: { value: string; label: string; color: string; bg: string; border: string; iconBase: string }[] = [
    { value: "all", label: "All Orders", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200", iconBase: "text-slate-500" },
    { value: "pending", label: "Pending", color: "text-amber-800", bg: "bg-amber-100", border: "border-amber-200", iconBase: "text-amber-600" },
    { value: "confirmed", label: "Confirmed", color: "text-blue-800", bg: "bg-blue-100", border: "border-blue-200", iconBase: "text-blue-600" },
    { value: "preparing", label: "Preparing", color: "text-orange-800", bg: "bg-orange-100", border: "border-orange-200", iconBase: "text-orange-600" },
    { value: "ready_for_pickup", label: "Ready", color: "text-purple-800", bg: "bg-purple-100", border: "border-purple-200", iconBase: "text-purple-600" },
    { value: "out_for_delivery", label: "En Route", color: "text-indigo-800", bg: "bg-indigo-100", border: "border-indigo-200", iconBase: "text-indigo-600" },
    { value: "delivered", label: "Delivered", color: "text-emerald-800", bg: "bg-emerald-100", border: "border-emerald-200", iconBase: "text-emerald-600" },
    { value: "cancelled", label: "Cancelled", color: "text-red-800", bg: "bg-red-100", border: "border-red-200", iconBase: "text-red-600" },
];

const STATUS_FLOW: OrderStatus[] = [
    "pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered"
];

export default function OrdersPage() {
    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusOrderId, setStatusOrderId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

    // Filters
    const [filters, setFilters] = useState<OrderFilters>({
        status: "all",
        page: 1,
        limit: 20,
    });
    const [showFilters, setShowFilters] = useState(false);
    const [isQrunchFilter, setIsQrunchFilter] = useState<string>("");
    const [restaurantId, setRestaurantId] = useState<string>("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Pagination
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Loading and messages
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await orderApi.getAll({
                ...filters,
                status: filters.status === "all" ? undefined : filters.status,
                is_qrunch: isQrunchFilter || undefined,
                restaurant_id: restaurantId || undefined,
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
            });
            setOrders(response.data?.orders || []);
            setTotalItems(response.data?.pagination?.total || 0);
            setTotalPages(response.data?.pagination?.total_pages || 0);
        } catch (err) {
            setError("Failed to fetch logistics data. Displaying sample trace.");
            // Sample data for demo if API fails
            setOrders([
                {
                    order_id: 83,
                    customer_id: "",
                    user_id: 0,
                    restaurant_id: 1,
                    order_status: "pending",
                    payment_status: "pending",
                    subtotal: 995,
                    tax_amount: 179.1,
                    total_amount: 1174.1,
                    is_qrunch: true,
                    qrunch_customer_name: "Hardik",
                    table_no: 6,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    order_id: 80,
                    customer_id: "cus_xyz",
                    user_id: 0,
                    restaurant_id: 1,
                    order_type: "DELIVERY",
                    order_status: "out_for_delivery",
                    payment_status: "PAID",
                    subtotal: 398,
                    tax_amount: 71.64,
                    total_amount: 469.64,
                    is_qrunch: false,
                    qrunch_customer_name: "",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
            setTotalItems(2);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [filters, isQrunchFilter, restaurantId, fromDate, toDate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Handlers
    const handleViewOrder = async (order: Order) => {
        setLoading(true);
        try {
            const response = await orderApi.getDetails(order.order_id);
            setSelectedOrder(response.data);
        } catch {
            // Use basic order data if details fail
            setSelectedOrder({
                ...order,
                items: [
                    { name: "Sample Item A", quantity: 2, unit_price: 200, total_price: 400, menu_item_name: "Sample Item A", menu_item_price: 200 },
                    { name: "Sample Item B", quantity: 1, unit_price: 350, total_price: 350, menu_item_name: "Sample Item B", menu_item_price: 350 }
                ],
                phone: "+91 98765 43210",
                delivery_address: order.order_type === "DELIVERY" ? "123 Business Park, Block A, Mumbai" : undefined
            });
        } finally {
            setLoading(false);
            setIsDetailModalOpen(true);
        }
    };

    const handleOpenStatusModal = (order: Order) => {
        setStatusOrderId(order.order_id);
        setNewStatus(order.order_status);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!statusOrderId) return;
        setLoading(true);
        try {
            await orderApi.updateStatus(statusOrderId, newStatus);
            setSuccessMessage("Logistics timeline advanced.");
            setIsStatusModalOpen(false);
            fetchOrders();
        } catch (err) {
            setError("Failed to update execution phase.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (orderId: number) => {
        try {
            const url = await orderApi.downloadPdf(orderId);
            const a = document.createElement('a');
            a.href = url;
            a.download = `order-${orderId}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch {
            setError("Failed to synthesize PDF export.");
        }
    };

    const handleViewReceipt = async (orderId: number) => {
        try {
            const receipt = await orderApi.getReceipt(orderId);
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                const pre = newWindow.document.createElement('pre');
                pre.style.fontFamily = 'monospace';
                pre.style.padding = '20px';
                pre.textContent = receipt;
                newWindow.document.body.appendChild(pre);
            }
        } catch {
            setError("Failed to connect to thermal print relay.");
        }
    };

    const getStatusConfig = (status: string) => {
        return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    };

    const getStatusIcon = (status: string, size = 16) => {
        switch (status) {
            case "pending": return <Clock size={size} />;
            case "confirmed": return <CheckCircle size={size} />;
            case "preparing": return <ChefHat size={size} />;
            case "ready_for_pickup": return <Package size={size} />;
            case "out_for_delivery": return <Truck size={size} />;
            case "delivered": return <CheckCircle size={size} />;
            case "cancelled": return <XCircle size={size} />;
            default: return <Clock size={size} />;
        }
    };

    const getOrderTypeLabel = (type: string | undefined) => {
        switch (type) {
            case "DINE_IN": return "Dine In";
            case "DELIVERY": return "Delivery";
            case "PICKUP": return "Pickup";
            default: return type || "Standard";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount || 0);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Logistics & Execution</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Real-time monitoring of all active transactions and dispatches.</p>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-colors shadow-sm font-semibold text-sm ${
                            showFilters ? "bg-amber-500 text-amber-950 hover:bg-amber-400" : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <Filter size={16} /> Filters
                    </button>
                    <button
                        onClick={() => fetchOrders()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-semibold text-sm"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Network
                    </button>
                </div>
            </div>

            {/* Error / Success Banners */}
            <div className="flex flex-col gap-3">
                {error && (
                    <div className="px-5 py-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-center justify-between text-red-700 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500" />
                            <span className="text-sm font-semibold">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors p-1"><X size={16} /></button>
                    </div>
                )}
                {successMessage && (
                    <div className="px-5 py-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex items-center justify-between text-emerald-800 animate-in fade-in slide-in-from-top-4">
                         <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className="text-sm font-semibold">{successMessage}</span>
                        </div>
                         <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors p-1"><X size={16} /></button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                
                {/* Advanced Filters Drawer */}
                {showFilters && (
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-1 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Channel</label>
                                <select value={isQrunchFilter} onChange={(e) => setIsQrunchFilter(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm font-semibold shadow-sm">
                                    <option value="">All Streams</option>
                                    <option value="true">QR / Table</option>
                                    <option value="false">Standard Delivery</option>
                                </select>
                            </div>
                            <div className="space-y-1 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Node ID</label>
                                <input type="text" placeholder="e.g. 1045" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm font-semibold shadow-sm" />
                            </div>
                            <div className="space-y-1 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">From Epoch</label>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm font-semibold shadow-sm text-slate-700" />
                            </div>
                            <div className="space-y-1 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">To Epoch</label>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm font-semibold shadow-sm text-slate-700" />
                            </div>
                            <div className="flex items-end lg:col-span-1">
                                <button onClick={() => { setIsQrunchFilter(""); setRestaurantId(""); setFromDate(""); setToDate(""); setFilters(prev => ({ ...prev, page: 1 })); }} className="w-full px-4 py-2.5 bg-slate-200/50 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors font-semibold shadow-sm text-sm">
                                    Flush Rules
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Tabs Navigation */}
                <div className="px-6 pt-4 pb-0 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar mask-edges-x">
                    {ORDER_STATUSES.map((status) => {
                        const isActive = filters.status === status.value;
                        return (
                            <button
                                key={status.value}
                                onClick={() => setFilters(prev => ({ ...prev, status: status.value, page: 1 }))}
                                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                                    isActive ? "border-amber-500 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-t-xl"
                                }`}
                            >
                                {isActive && status.value !== 'all' ? getStatusIcon(status.value, 16) : null}
                                {status.label}
                            </button>
                        );
                    })}
                </div>

                {/* Data Table Area */}
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                            <p className="text-slate-500 font-medium">Interpolating logistics stream...</p>
                        </div>
                    ) : orders.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/30">
                            <Image src="/empty_search.png" alt="No orders found" width={160} height={160} className="mb-6 opacity-90 drop-shadow-md mix-blend-multiply rounded-3xl" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Network Quiet</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm">No recorded dispatches match the current filtration parameters.</p>
                        </div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Tracking Hash</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Protocol</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Settlement</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Phase</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Temporal</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Overrides</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.map((order) => {
                                    const stConfig = getStatusConfig(order.order_status);
                                    return (
                                        <tr key={order.order_id} className="hover:bg-amber-50/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-500">
                                                        <Activity size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                                            {order.order_number || `#${order.order_id}`}
                                                        </span>
                                                        <div className="mt-0.5">
                                                            {order.is_qrunch && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold rounded uppercase">
                                                                    <QrCode size={10} /> QR Link
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {order.order_type ? (
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold">
                                                            {getOrderTypeLabel(order.order_type)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm font-medium">N/A</span>
                                                    )}
                                                    {order.table_no && (
                                                        <span className="text-xs font-semibold text-slate-500 px-1">Tbl: {order.table_no}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {order.qrunch_customer_name || order.customer_id?.slice(0, 8) || "Guest"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-max shadow-sm">
                                                        {formatCurrency(order.total_amount)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 w-max text-[10px] font-bold uppercase rounded-md border ${
                                                        order.payment_status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}>
                                                        {order.payment_status || "PENDING"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => handleOpenStatusModal(order)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border hover:shadow-sm transition-all ${stConfig.bg} ${stConfig.color} ${stConfig.border}`}
                                                >
                                                    {getStatusIcon(order.order_status, 14)}
                                                    {stConfig.label}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span className="text-xs font-medium">{formatDate(order.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleViewOrder(order)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors tooltip-trigger">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button onClick={() => handleViewReceipt(order.order_id)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                                                        <Receipt size={18} />
                                                    </button>
                                                    <button onClick={() => handleDownloadPdf(order.order_id)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                                                        <Download size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                {!loading && totalPages > 1 && orders.length > 0 && (
                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-500">
                            Reading spectrum <span className="font-bold text-slate-900">{filters.page || 1}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                             <button
                                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                disabled={(filters.page || 1) <= 1}
                                className="px-4 py-2 border border-slate-200/80 bg-white rounded-xl text-slate-600 disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 transition-colors font-semibold shadow-sm flex items-center gap-1 text-sm"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                disabled={(filters.page || 1) >= totalPages}
                                className="px-4 py-2 border border-slate-200/80 bg-white rounded-xl text-slate-600 disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 transition-colors font-semibold shadow-sm flex items-center gap-1 text-sm"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details Modal (Premium Redesign) */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Operational Dispatch Summary">
                {selectedOrder && (
                    <div className="space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar pb-4 pr-2">
                        {/* Header Block */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-slate-800">
                            <div className="absolute -right-10 -top-10 opacity-10 blur-xl">
                                <Package size={150} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-black mb-1">{selectedOrder.order_number || `#${selectedOrder.order_id}`}</h3>
                                    <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                                        <Calendar size={14} /> {formatDate(selectedOrder.created_at)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${getStatusConfig(selectedOrder.order_status).bg} ${getStatusConfig(selectedOrder.order_status).color} ${getStatusConfig(selectedOrder.order_status).border}`}>
                                        {getStatusConfig(selectedOrder.order_status).label}
                                    </span>
                                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase border bg-white/10 ${selectedOrder.payment_status === "PAID" ? "text-emerald-400 border-emerald-400/30" : "text-amber-400 border-amber-400/30"}`}>
                                        Payment: {selectedOrder.payment_status || "PENDING"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Route Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><UserCheck size={14}/> Subject Identity</h4>
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        {selectedOrder.first_name && selectedOrder.last_name
                                            ? `${selectedOrder.first_name} ${selectedOrder.last_name}`
                                            : selectedOrder.qrunch_customer_name || "Anonymous Guest"}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <Phone size={14} className="text-slate-400" /> {selectedOrder.phone || "No transmission vector"}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Truck size={14}/> Delivery Protocol</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                         <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold">
                                            {selectedOrder.order_type ? getOrderTypeLabel(selectedOrder.order_type) : "N/A"}
                                        </span>
                                        {selectedOrder.table_no && <span className="text-xs font-bold text-slate-500">Table: {selectedOrder.table_no}</span>}
                                    </div>
                                    {selectedOrder.delivery_address && (
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed flex items-start gap-2">
                                           <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                           <span>{selectedOrder.delivery_address}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Payload */}
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                             <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Package size={14}/> Payload Details</h4>
                            </div>
                            <div className="p-1">
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${item.menu_item_is_vegetarian ? "border-emerald-500 bg-emerald-50" : item.menu_item_is_vegetarian === false ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-100"}`}>
                                                        <div className={`w-2.5 h-2.5 rounded-full ${item.menu_item_is_vegetarian ? "bg-emerald-500" : item.menu_item_is_vegetarian === false ? "bg-red-500" : "bg-slate-400"}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{item.name || item.menu_item_name}</p>
                                                        <p className="text-xs font-semibold text-slate-500 mt-1">{formatCurrency(item.unit_price || item.menu_item_price)} × {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-sm text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">{formatCurrency(item.total_price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-sm font-medium text-slate-500">No payload items detected.</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            {/* Special Instructions */}
                            <div className="md:col-span-2">
                                {selectedOrder.special_instructions ? (
                                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 h-full">
                                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2"><AlertCircle size={14}/> Execution Overrides</h4>
                                        <p className="text-sm font-medium text-amber-900 leading-relaxed italic">{`"${selectedOrder.special_instructions}"`}</p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 h-full border-dashed flex items-center justify-center text-center">
                                         <p className="text-sm font-medium text-slate-400">No special handling instructions provided.</p>
                                    </div>
                                )}
                            </div>

                            {/* Aggregation */}
                            <div className="md:col-span-3 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200/60 pb-2">Financial Aggregation</h4>
                                <div className="space-y-3 text-sm font-medium text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Base Payload Value</span>
                                        <span className="text-slate-900">{formatCurrency(selectedOrder.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Government Levies (Tax)</span>
                                        <span className="text-slate-900">{formatCurrency(selectedOrder.tax_amount)}</span>
                                    </div>
                                    {(selectedOrder.delivery_fee ?? 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Dispatch Freight</span>
                                            <span className="text-slate-900">{formatCurrency(selectedOrder.delivery_fee!)}</span>
                                        </div>
                                    )}
                                    {(selectedOrder.tip_amount ?? 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span>Courier Gratuity</span>
                                            <span className="text-slate-900">{formatCurrency(selectedOrder.tip_amount!)}</span>
                                        </div>
                                    )}
                                    {(selectedOrder.discount_amount ?? 0) > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Promotional Deduction</span>
                                            <span className="font-bold">-{formatCurrency(selectedOrder.discount_amount!)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-xl text-slate-900 border-t border-slate-200 pt-3 mt-2">
                                        <span>Total Settlement</span>
                                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Premium Update Status Modal */}
            <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Modify Phase Execution">
                <div className="space-y-6">
                    <p className="text-sm text-slate-500 font-medium">Select the next logistical phase for this operation to notify network participants.</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {STATUS_FLOW.map((status) => {
                             const stConfig = getStatusConfig(status);
                             const isSelected = newStatus === status;
                             return (
                                <button
                                    key={status}
                                    onClick={() => setNewStatus(status)}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                        isSelected
                                        ? `border-amber-500 bg-amber-50 shadow-md shadow-amber-500/10`
                                        : `border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50`
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? stConfig.bg : 'bg-slate-100'} ${isSelected ? stConfig.color : 'text-slate-400'}`}>
                                        {getStatusIcon(status, 20)}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider text-center ${isSelected ? 'text-amber-800' : 'text-slate-500'}`}>
                                        {stConfig.label}
                                    </span>
                                </button>
                             )
                        })}
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Terminate Operation</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setNewStatus("cancelled")}
                                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${
                                    newStatus === "cancelled"
                                    ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20"
                                    : "bg-white text-red-600 border-red-100 hover:bg-red-50"
                                }`}
                            >
                                Force Cancel
                            </button>
                            <button
                                onClick={() => setNewStatus("refunded")}
                                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${
                                    newStatus === "refunded"
                                    ? "bg-slate-800 text-white border-slate-900 shadow-md shadow-slate-800/20"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                            >
                                Initiate Refund
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <button onClick={handleUpdateStatus} disabled={loading} className="flex-1 px-4 py-3 bg-amber-500 text-amber-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors">
                            {loading ? "Broadcasting..." : "Broadcast Update"}
                        </button>
                        <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                            Close Tool
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
