"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Eye, Pencil, Trash2, Plus, Search, MapPin, Store,
    Loader2, AlertCircle, ChevronLeft, ChevronRight, X,
    CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import Modal from "@/components/Modal";
import { restaurantApi, Restaurant, RestaurantFilters, UpdateRestaurantRequest, UpdateRestaurantFiles } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RestaurantsPage() {
    // State
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const router = useRouter();

    // Filters & Pagination
    const [filters, setFilters] = useState<RestaurantFilters>({
        page: 1,
        limit: 10,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isRegisteredFilter, setIsRegisteredFilter] = useState("");
    const [totalItems, setTotalItems] = useState(0);

    // View filter for different restaurant lists
    type ViewFilter = 'all' | 'recent' | 'unregistered' | 'no-qrunch' | 'qrunch-requested';
    const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

    // Edit form
    const [editForm, setEditForm] = useState<UpdateRestaurantRequest>({});
    const [editFiles, setEditFiles] = useState<Partial<UpdateRestaurantFiles>>({});

    // Loading and messages
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch restaurants
    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await restaurantApi.getAll({
                ...filters,
                q: searchQuery || undefined,
                city: cityFilter || undefined,
                status: statusFilter || undefined,
                is_restaurant_registered: isRegisteredFilter || undefined,
            });
            setRestaurants(response.data?.items || []);
            setTotalItems(response.data?.meta?.total || 0);
        } catch (err: any) {
            setError(err.message || "Failed to fetch restaurants. Please try again later.");
            setRestaurants([]); // Clear list on error instead of using mock data
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, cityFilter, statusFilter, isRegisteredFilter]);

    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    // Clear messages
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Apply view filter to restaurants
    const applyViewFilter = useCallback((restaurantList: Restaurant[]): Restaurant[] => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        switch (viewFilter) {
            case 'recent':
                return restaurantList.filter(r => new Date(r.created_at || '') >= sevenDaysAgo);
            case 'unregistered':
                return restaurantList.filter(r => r.is_restaurant_registered === false);
            case 'no-qrunch':
                return restaurantList.filter(r => r.is_qrunch_purchased === false);
            case 'qrunch-requested':
                return restaurantList.filter(r => r.is_qrunch_requested === true && r.is_qrunch_purchased === false);
            default:
                return restaurantList;
        }
    }, [viewFilter]);

    // Get filtered restaurants
    const filteredRestaurants = applyViewFilter(restaurants);

    // Calculate statistics
    const stats = {
        total: restaurants.length,
        recent: restaurants.filter(r => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(r.created_at || '') >= sevenDaysAgo;
        }).length,
        unregistered: restaurants.filter(r => r.is_restaurant_registered === false).length,
        noQrunch: restaurants.filter(r => r.is_qrunch_purchased === false).length,
        qrunchRequested: restaurants.filter(r => r.is_qrunch_requested === true && r.is_qrunch_purchased === false).length,
    };

    // Handlers
    const handleSearch = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleViewRestaurant = (restaurant: Restaurant) => {
        router.push(`/restaurants/${restaurant.id}`);
    };

    const handleEditRestaurant = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setEditForm({
            name: restaurant.name,
            owner_name: restaurant.owner_name,
            slug: restaurant.slug,
            type: restaurant.type,
            category: restaurant.category,
            gst_number: restaurant.gst_number,
            fssai_number: restaurant.fssai_number,
            street_address: restaurant.street_address,
            city: restaurant.city,
            state: restaurant.state,
            postal_code: restaurant.postal_code,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            status: restaurant.status,
            upi_vpa: restaurant.upi_vpa,
            phone: restaurant.phone,
            description: restaurant.description,
            is_qrunch_purchased: restaurant.is_qrunch_purchased,
            is_qrunch_requested: restaurant.is_qrunch_requested,
            is_restaurant_registered: restaurant.is_restaurant_registered,
        });
        setEditFiles({});
        setIsEditModalOpen(true);
    };

    const handleUpdateRestaurant = async () => {
        if (!selectedRestaurant) return;
        setLoading(true);
        setError(null);
        try {
            await restaurantApi.patch(selectedRestaurant.id, editForm, editFiles);
            setSuccessMessage("Restaurant updated successfully!");
            setIsEditModalOpen(false);
            setEditFiles({});
            fetchRestaurants();
        } catch (err: any) {
            setError(err.message || "Failed to update restaurant");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRestaurant = async (id: number) => {
        setLoading(true);
        try {
            await restaurantApi.delete(id);
            setSuccessMessage("Restaurant deleted successfully!");
            setDeleteConfirm(null);
            fetchRestaurants();
        } catch (err) {
            setError("Failed to delete restaurant");
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / (filters.limit || 10));

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: "bg-green-100 text-green-700",
            inactive: "bg-gray-100 text-gray-700",
            pending: "bg-yellow-100 text-yellow-700",
            open: "bg-green-100 text-green-700", // Added for sample data consistency
        };
        return styles[status.toLowerCase()] || styles.inactive;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
                    <p className="text-sm text-gray-500">Manage all restaurants on the platform</p>
                </div>
                <button
                    onClick={fetchRestaurants}
                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                        <X size={18} />
                    </button>
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                    <CheckCircle size={18} />
                    {successMessage}
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div
                    onClick={() => setViewFilter('all')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${viewFilter === 'all'
                        ? 'bg-yellow-50 border-yellow-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-yellow-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">Total</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <Store className={viewFilter === 'all' ? 'text-yellow-500' : 'text-gray-400'} size={32} />
                    </div>
                </div>

                <div
                    onClick={() => setViewFilter('recent')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${viewFilter === 'recent'
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">Recent (7d)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recent}</p>
                        </div>
                        <RefreshCw className={viewFilter === 'recent' ? 'text-blue-500' : 'text-gray-400'} size={32} />
                    </div>
                </div>

                <div
                    onClick={() => setViewFilter('unregistered')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${viewFilter === 'unregistered'
                        ? 'bg-orange-50 border-orange-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-orange-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">Not Registered</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.unregistered}</p>
                        </div>
                        <XCircle className={viewFilter === 'unregistered' ? 'text-orange-500' : 'text-gray-400'} size={32} />
                    </div>
                </div>

                <div
                    onClick={() => setViewFilter('no-qrunch')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${viewFilter === 'no-qrunch'
                        ? 'bg-red-50 border-red-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-red-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">No Qrunch</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.noQrunch}</p>
                        </div>
                        <AlertCircle className={viewFilter === 'no-qrunch' ? 'text-red-500' : 'text-gray-400'} size={32} />
                    </div>
                </div>

                <div
                    onClick={() => setViewFilter('qrunch-requested')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${viewFilter === 'qrunch-requested'
                        ? 'bg-purple-50 border-purple-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">Requested</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.qrunchRequested}</p>
                        </div>
                        <CheckCircle className={viewFilter === 'qrunch-requested' ? 'text-purple-500' : 'text-gray-400'} size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full sm:w-48 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Search
                    </button>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Registration</label>
                        <select
                            value={isRegisteredFilter}
                            onChange={(e) => setIsRegisteredFilter(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                        >
                            <option value="">All Restaurants</option>
                            <option value="true">Registered Only</option>
                            <option value="false">Unregistered Only</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setCityFilter("");
                                setStatusFilter("");
                                setIsRegisteredFilter("");
                                setFilters(prev => ({ ...prev, page: 1 }));
                            }}
                            className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Restaurant List */}
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qrunch</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredRestaurants.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p>No restaurants found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRestaurants.map((restaurant) => (
                                            <tr key={restaurant.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {restaurant.logo_url ? (
                                                            <img
                                                                src={restaurant.logo_url}
                                                                alt={restaurant.name}
                                                                className="w-10 h-10 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                                <Store className="text-yellow-600" size={20} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-900">{restaurant.name}</p>
                                                            <p className="text-xs text-gray-500">{restaurant.type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {restaurant.owner_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {restaurant.city}, {restaurant.state}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {restaurant.category}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(restaurant.status)}`}>
                                                        {restaurant.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${restaurant.is_restaurant_registered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {restaurant.is_restaurant_registered ? 'Registered' : 'Unregistered'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {restaurant.is_qrunch_purchased ? (
                                                        <CheckCircle className="text-green-500" size={18} />
                                                    ) : (
                                                        <XCircle className="text-gray-300" size={18} />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewRestaurant(restaurant)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditRestaurant(restaurant)}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(restaurant.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
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
                                    Showing {((filters.page || 1) - 1) * (filters.limit || 10) + 1} to{" "}
                                    {Math.min((filters.page || 1) * (filters.limit || 10), totalItems)} of {totalItems}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                        disabled={(filters.page || 1) <= 1}
                                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="px-3 py-1 text-sm">
                                        Page {filters.page || 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                        disabled={(filters.page || 1) >= totalPages}
                                        className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={selectedRestaurant ? "Edit Restaurant" : "Add Restaurant"}
                maxWidth="3xl"
            >
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                                <input
                                    type="text"
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="My Restaurant"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                <input
                                    type="text"
                                    value={editForm.owner_name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={editForm.slug || ""}
                                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="my-restaurant"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={editForm.type || ""}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                >
                                    <option value="Veg">Veg</option>
                                    <option value="Non-Veg">Non-Veg</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={editForm.category || ""}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="North Indian, Chinese, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone || ""}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="+91 1234567890"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={editForm.description || ""}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                rows={2}
                                placeholder="Brief description of the restaurant"
                            />
                        </div>
                    </div>

                    {/* Legal & Compliance */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Legal & Compliance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                                <input
                                    type="text"
                                    value={editForm.gst_number || ""}
                                    onChange={(e) => setEditForm({ ...editForm, gst_number: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="07AAAAA0000A1Z5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI Number</label>
                                <input
                                    type="text"
                                    value={editForm.fssai_number || ""}
                                    onChange={(e) => setEditForm({ ...editForm, fssai_number: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="12345678901234"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Location</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                            <input
                                type="text"
                                value={editForm.street_address || ""}
                                onChange={(e) => setEditForm({ ...editForm, street_address: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                placeholder="123, Main Street"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={editForm.city || ""}
                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="New Delhi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    value={editForm.state || ""}
                                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="Delhi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                                <input
                                    type="text"
                                    value={editForm.postal_code || ""}
                                    onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="110001"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={editForm.latitude || ""}
                                    onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || undefined })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="28.6139"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={editForm.longitude || ""}
                                    onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || undefined })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="77.2090"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Uploads */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">File Uploads</h3>
                        <p className="text-xs text-gray-500">Accepted formats: jpg, png, webp, pdf. Max size: 10MB per file.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                                {selectedRestaurant?.logo_url && (
                                    <p className="text-xs text-gray-500 mb-1">Current: {selectedRestaurant.logo_url.split('/').pop()}</p>
                                )}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                                setError("Logo file size must be less than 10MB");
                                                e.target.value = '';
                                            } else {
                                                setEditFiles({ ...editFiles, logo_url: file });
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                                {selectedRestaurant?.background_url && (
                                    <p className="text-xs text-gray-500 mb-1">Current: {selectedRestaurant.background_url.split('/').pop()}</p>
                                )}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                                setError("Background file size must be less than 10MB");
                                                e.target.value = '';
                                            } else {
                                                setEditFiles({ ...editFiles, background_url: file });
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Certificate</label>
                                {selectedRestaurant?.gst_certificate_url && (
                                    <p className="text-xs text-gray-500 mb-1">Current: {selectedRestaurant.gst_certificate_url.split('/').pop()}</p>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                                setError("File size must be less than 10MB");
                                                e.target.value = '';
                                            } else {
                                                setEditFiles({ ...editFiles, gst_certificate_url: file });
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI License</label>
                                {selectedRestaurant?.fssai_license_url && (
                                    <p className="text-xs text-gray-500 mb-1">Current: {selectedRestaurant.fssai_license_url.split('/').pop()}</p>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                                setError("File size must be less than 10MB");
                                                e.target.value = '';
                                            } else {
                                                setEditFiles({ ...editFiles, fssai_license_url: file });
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Card</label>
                                {selectedRestaurant?.aadhaar_card_url && (
                                    <p className="text-xs text-gray-500 mb-1">Current: {selectedRestaurant.aadhaar_card_url.split('/').pop()}</p>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                                setError("File size must be less than 10MB");
                                                e.target.value = '';
                                            } else {
                                                setEditFiles({ ...editFiles, aadhaar_card_url: file });
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card</label>
                                {selectedRestaurant?.pan_card_url && (
                                    <p className="text-xs text-gray-500 mb-1">Current: {selectedRestaurant.pan_card_url.split('/').pop()}</p>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 10 * 1024 * 1024) {
                                                setError("File size must be less than 10MB");
                                                e.target.value = '';
                                            } else {
                                                setEditFiles({ ...editFiles, pan_card_url: file });
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status & Payment */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Status & Payment</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editForm.status || ""}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">UPI VPA</label>
                                <input
                                    type="text"
                                    value={editForm.upi_vpa || ""}
                                    onChange={(e) => setEditForm({ ...editForm, upi_vpa: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    placeholder="restaurant@upi"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_qrunch_purchased || false}
                                    onChange={(e) => setEditForm({ ...editForm, is_qrunch_purchased: e.target.checked })}
                                    className="rounded text-yellow-500 focus:ring-yellow-500"
                                />
                                <span className="text-sm text-gray-700">Qrunch Purchased</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_qrunch_requested || false}
                                    onChange={(e) => setEditForm({ ...editForm, is_qrunch_requested: e.target.checked })}
                                    className="rounded text-yellow-500 focus:ring-yellow-500"
                                />
                                <span className="text-sm text-gray-700">Qrunch Requested</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_restaurant_registered || false}
                                    onChange={(e) => setEditForm({ ...editForm, is_restaurant_registered: e.target.checked })}
                                    className="rounded text-yellow-500 focus:ring-yellow-500"
                                />
                                <span className="text-sm text-gray-700">Restaurant Registered</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t">
                    <button
                        onClick={handleUpdateRestaurant}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                        onClick={() => {
                            setIsEditModalOpen(false);
                            setEditFiles({});
                            setError(null);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Restaurant"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                        <AlertCircle className="text-red-500" size={24} />
                        <p className="text-red-700">
                            Are you sure you want to delete this restaurant? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => deleteConfirm && handleDeleteRestaurant(deleteConfirm)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                            {loading ? "Deleting..." : "Delete Restaurant"}
                        </button>
                        <button
                            onClick={() => setDeleteConfirm(null)}
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
