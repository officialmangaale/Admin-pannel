"use client";

import { useState, useEffect } from "react";
import {
    Eye, Package, Truck, ChefHat, CheckCircle, XCircle, Clock,
    Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    X, RefreshCw, Download, Receipt, Calendar, QrCode
} from "lucide-react";
import Modal from "@/components/Modal";
import { orderApi, Order, OrderFilters, OrderStatus, OrderDetails } from "@/lib/api";

const ORDER_STATUSES: { value: string; label: string; color: string }[] = [
    { value: "all", label: "All Orders", color: "bg-gray-100 text-gray-700" },
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    { value: "preparing", label: "Preparing", color: "bg-orange-100 text-orange-700" },
    { value: "ready_for_pickup", label: "Ready", color: "bg-purple-100 text-purple-700" },
    { value: "out_for_delivery", label: "Out for Delivery", color: "bg-indigo-100 text-indigo-700" },
    { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
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
    const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Local loading for modal
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch orders with cleanup to prevent race conditions
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchOrders = async () => {
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

                // Only update state if component is still mounted
                if (isMounted) {
                    setOrders(response.data?.orders || []);
                    setTotalItems(response.data?.pagination?.total || 0);
                    setTotalPages(response.data?.pagination?.total_pages || 0);
                }
            } catch (err) {
                if (isMounted) {
                    const errorMessage = err instanceof Error
                        ? err.message
                        : "Failed to fetch orders. Please try again.";
                    setError(errorMessage);
                    // Don't use sample data - show actual error
                    setOrders([]);
                    setTotalItems(0);
                    setTotalPages(0);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchOrders();

        // Cleanup function
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [filters, isQrunchFilter, restaurantId, fromDate, toDate]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Handlers
    const handleViewOrder = async (order: Order) => {
        setIsLoadingDetails(true); // Use local loading state
        try {
            const response = await orderApi.getDetails(order.order_id);
            setSelectedOrder(response.data);
        } catch (err) {
            console.error('Failed to fetch order details:', err);
            // Fallback to basic order data
            setSelectedOrder({
                ...order,
                items: [],
            });
        } finally {
            setIsLoadingDetails(false);
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
        setError(null); // Clear previous errors
        try {
            await orderApi.updateStatus(statusOrderId, newStatus);
            setSuccessMessage("Order status updated successfully!");
            setIsStatusModalOpen(false);
            // Trigger refetch
            setFilters(prev => ({ ...prev }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update order status";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (orderId: number) => {
        try {
            const { url, cleanup } = await orderApi.downloadPdf(orderId);
            const a = document.createElement('a');
            a.href = url;
            a.download = `order-${orderId}.pdf`;
            a.click();
            // Clean up blob URL to prevent memory leak
            setTimeout(cleanup, 100);
        } catch (err) {
            console.error('Failed to download PDF:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to download PDF";
            setError(errorMessage);
        }
    };

    const handleViewReceipt = async (orderId: number) => {
        try {
            const receipt = await orderApi.getReceipt(orderId);
            // Open receipt in new window using blob approach (safer than document.write)
            const blob = new Blob([receipt], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            // Clean up after opening
            setTimeout(() => URL.revokeObjectURL(url), 100);

            if (!newWindow) {
                setError("Please allow popups to view receipt");
            }
        } catch (err) {
            console.error('Failed to get receipt:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to get receipt";
            setError(errorMessage);
        }
    };

    const getStatusConfig = (status: string) => {
        return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending": return <Clock size={16} />;
            case "confirmed": return <CheckCircle size={16} />;
            case "preparing": return <ChefHat size={16} />;
            case "ready_for_pickup": return <Package size={16} />;
            case "out_for_delivery": return <Truck size={16} />;
            case "delivered": return <CheckCircle size={16} />;
            case "cancelled": return <XCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getOrderTypeLabel = (type: string) => {
        switch (type) {
            case "DINE_IN": return "Dine In";
            case "DELIVERY": return "Delivery";
            case "PICKUP": return "Pickup";
            default: return type;
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
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-sm text-gray-500">View and manage all orders</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${showFilters ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <Filter size={16} /> Filters
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev }))}
                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X size={18} /></button>
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                    <CheckCircle size={18} />
                    {successMessage}
                </div>
            )}

            {/* Status Tabs */}
            <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {ORDER_STATUSES.map((status) => (
                        <button
                            key={status.value}
                            onClick={() => setFilters(prev => ({ ...prev, status: status.value, page: 1 }))}
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filters.status === status.value
                                ? "bg-yellow-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">QR Orders</label>
                            <select
                                value={isQrunchFilter}
                                onChange={(e) => setIsQrunchFilter(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">All Orders</option>
                                <option value="true">QR Orders Only</option>
                                <option value="false">Non-QR Orders</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant ID</label>
                            <input
                                type="text"
                                placeholder="Filter by ID..."
                                value={restaurantId}
                                onChange={(e) => setRestaurantId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setIsQrunchFilter("");
                                    setRestaurantId("");
                                    setFromDate("");
                                    setToDate("");
                                    setFilters(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p>No orders found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.order_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">
                                                            {order.order_number || `#${order.order_id}`}
                                                        </span>
                                                        {order.is_qrunch && (
                                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                                                <QrCode size={12} className="inline" /> QR
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {order.order_type ? (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                            {getOrderTypeLabel(order.order_type)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                    {order.table_no && (
                                                        <span className="ml-1 text-gray-500">Table {order.table_no}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {order.qrunch_customer_name || order.customer_id?.slice(0, 8) || "Guest"}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleOpenStatusModal(order)}
                                                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusConfig(order.order_status).color}`}
                                                    >
                                                        {getStatusIcon(order.order_status)}
                                                        {getStatusConfig(order.order_status).label}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${order.payment_status === "PAID"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                        {order.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleViewOrder(order)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewReceipt(order.order_id)}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                            title="View Receipt"
                                                        >
                                                            <Receipt size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadPdf(order.order_id)}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                            title="Download PDF"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Page {filters.page || 1} of {totalPages} ({totalItems} orders)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                        disabled={(filters.page || 1) <= 1}
                                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                        disabled={(filters.page || 1) >= totalPages}
                                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Details Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Order Details"
            >
                {selectedOrder && (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {/* Order Header */}
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedOrder.order_number || `#${selectedOrder.order_id}`}</h3>
                                <p className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedOrder.order_status).color}`}>
                                {getStatusConfig(selectedOrder.order_status).label}
                            </span>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Customer</p>
                                <p className="font-medium">
                                    {selectedOrder.first_name && selectedOrder.last_name
                                        ? `${selectedOrder.first_name} ${selectedOrder.last_name}`
                                        : selectedOrder.qrunch_customer_name || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Phone</p>
                                <p className="font-medium">{selectedOrder.phone || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Order Type</p>
                                <p className="font-medium">{selectedOrder.order_type ? getOrderTypeLabel(selectedOrder.order_type) : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Table</p>
                                <p className="font-medium">{selectedOrder.table_no || "N/A"}</p>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        {selectedOrder.delivery_address && (
                            <div className="text-sm">
                                <p className="text-gray-500">Delivery Address</p>
                                <p className="font-medium">{selectedOrder.delivery_address}</p>
                            </div>
                        )}

                        {/* Order Items */}
                        {selectedOrder.items && selectedOrder.items.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Items</p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                {item.menu_item_is_vegetarian !== undefined && (
                                                    <span className={`w-4 h-4 border-2 ${item.menu_item_is_vegetarian ? "border-green-500" : "border-red-500"}`} />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">{item.name || item.menu_item_name}</p>
                                                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="font-medium text-sm">{formatCurrency(item.total_price)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{formatCurrency(selectedOrder.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax</span>
                                <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                            </div>
                            {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Delivery Fee</span>
                                    <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                                </div>
                            )}
                            {selectedOrder.tip_amount && selectedOrder.tip_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tip</span>
                                    <span>{formatCurrency(selectedOrder.tip_amount)}</span>
                                </div>
                            )}
                            {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                <span>Total</span>
                                <span>{formatCurrency(selectedOrder.total_amount)}</span>
                            </div>
                        </div>

                        {/* Special Instructions */}
                        {selectedOrder.special_instructions && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800">Special Instructions</p>
                                <p className="text-sm text-yellow-700">{selectedOrder.special_instructions}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Update Status Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title="Update Order Status"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {STATUS_FLOW.map((status) => (
                            <button
                                key={status}
                                onClick={() => setNewStatus(status)}
                                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${newStatus === status
                                    ? "border-yellow-500 bg-yellow-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                {getStatusIcon(status)}
                                <span className="text-sm font-medium capitalize">
                                    {status.replace(/_/g, " ")}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 mb-2">Or mark as:</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewStatus("cancelled")}
                                className={`px-4 py-2 rounded-lg text-sm ${newStatus === "cancelled"
                                    ? "bg-red-500 text-white"
                                    : "bg-red-50 text-red-600 hover:bg-red-100"
                                    }`}
                            >
                                Cancelled
                            </button>
                            <button
                                onClick={() => setNewStatus("refunded")}
                                className={`px-4 py-2 rounded-lg text-sm ${newStatus === "refunded"
                                    ? "bg-gray-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                Refunded
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                        <button
                            onClick={handleUpdateStatus}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update Status"}
                        </button>
                        <button
                            onClick={() => setIsStatusModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
