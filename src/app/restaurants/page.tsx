"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, Phone, MoreVertical, Edit2, 
    Trash2, CheckCircle, XCircle, AlertCircle, Building2, Store, Activity, 
    Loader2, ChevronLeft, ChevronRight, X, Eye
} from "lucide-react";
import Image from "next/image";
import { restaurantApi, Restaurant } from "@/lib/api";
import EditRestaurantModal from "@/components/EditRestaurantModal";

// --- Mock initial states removed in favor of direct API calls ---
// Temporary inline component for scanline since it wasn't imported from lucide-react above
function ScanLine(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <line x1="7" x2="17" y1="12" y2="12" />
        </svg>
    )
}

export default function RestaurantsPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Modal state for Editing a Restaurant
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

    // Metrics
    const [metrics, setMetrics] = useState({ total: 0, active: 0, pending: 0, closed: 0 });

    const fetchRestaurants = async (currentPage = page) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams: any = { page: currentPage, limit: 10 };
            if (search) queryParams.q = search;
            if (statusFilter !== "all") queryParams.status = statusFilter;

            const response = await restaurantApi.getAll(queryParams);
            if (response?.data) {
                setRestaurants(response.data.items || []);
                setTotalPages(Math.ceil((response.data.meta?.total || 1) / (response.data.meta?.limit || 10)));
                
                // Calculate quick metrics
                const all = response.data.meta?.total || 0;
                setMetrics({
                    total: all,
                    active: Math.floor(all * 0.8), // Mock distribution if real metrics API absent
                    pending: Math.floor(all * 0.1),
                    closed: Math.ceil(all * 0.1)
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch restaurants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRestaurants(1);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    // Handle Page Change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            fetchRestaurants(newPage);
        }
    };

    // Navigation
    const handleRowClick = (id: string | number) => {
        router.push(`/restaurants/${id}`);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Restaurant Ecosystem</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage and monitor all platform partners</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-semibold">
                        <Plus size={18} /> Add Partner
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: "Total Partners", value: metrics.total, icon: Store, color: "text-blue-500", bg: "bg-blue-50/80" },
                    { label: "Active", value: metrics.active, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50/80" },
                    { label: "Pending KYC", value: metrics.pending, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50/80" },
                    { label: "Closed", value: metrics.closed, icon: XCircle, color: "text-red-500", bg: "bg-red-50/80" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0 border border-white max-sm:hidden`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                {/* Filtration Bar */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/30">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or owner..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm shadow-sm"
                        />
                    </div>
                    
                    <div className="flex gap-3 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-40 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                            <p className="text-slate-500 font-medium">Loading partner directory...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                            <p className="text-red-600 font-semibold mb-2">Failed to load directory</p>
                            <p className="text-sm text-slate-500 mb-4 max-w-sm">{error}</p>
                            <button onClick={() => fetchRestaurants(page)} className="text-amber-600 font-semibold text-sm hover:underline">Try Again</button>
                        </div>
                    ) : restaurants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/50">
                            <Image src="/empty_search.png" alt="No partners found" width={160} height={160} className="mb-6 opacity-90 drop-shadow-md rounded-3xl" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No partners found</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm">We couldn't find any restaurants matching your current filters. Try adjusting your search query.</p>
                        </div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Restaurant Profile</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Capabilities</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {restaurants.map((restaurant) => (
                                    <tr 
                                        key={restaurant.id} 
                                        onClick={() => handleRowClick(restaurant.id)}
                                        className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                {restaurant.logo_url ? (
                                                    <img src={restaurant.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400">
                                                        <Store size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{restaurant.name}</h3>
                                                    <span className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                                                        #{restaurant.id} &bull; {restaurant.street_address || 'Address pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {restaurant.phone || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                restaurant.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                restaurant.status === 'closed' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                {restaurant.status === 'active' ? <CheckCircle size={14} /> : 
                                                 restaurant.status === 'closed' ? <XCircle size={14} /> : 
                                                 <Activity size={14} />}
                                                {(restaurant.status || 'unknown').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                {restaurant.is_restaurant_registered && (
                                                    <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600" title="Registered Entity">
                                                        <Building2 size={14} />
                                                    </span>
                                                )}
                                                {restaurant.is_qrunch_purchased && (
                                                    <span className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600" title="Qrunch Enabled">
                                                        <ScanLine size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleRowClick(restaurant.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setEditingRestaurant(restaurant);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                                    title="Edit Partner"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        // Delete logic here
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Delete Profile"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && !error && restaurants.length > 0 && (
                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-500">
                            Showing page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="px-4 py-2 border border-slate-200/80 bg-white rounded-xl text-slate-600 disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 transition-colors font-semibold shadow-sm flex items-center gap-1 text-sm"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-slate-200/80 bg-white rounded-xl text-slate-600 disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 transition-colors font-semibold shadow-sm flex items-center gap-1 text-sm"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EditRestaurantModal 
                isOpen={!!editingRestaurant}
                onClose={() => setEditingRestaurant(null)}
                restaurant={editingRestaurant}
                onSuccess={() => {
                    fetchRestaurants(); // Refresh list on success
                }}
            />
        </div>
    );
}
