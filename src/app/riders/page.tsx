"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
    Lock, Unlock, Eye, Search, Filter, RefreshCw, 
    Star, MapPin, Activity, ShieldAlert, Phone, Mail, Navigation, Bike, Package
} from "lucide-react";
import Modal from "@/components/Modal";
import classNames from "classnames";

// Interfaces
interface Rider {
    id: number;
    name: string;
    contact: string;
    email: string;
    status: "active" | "blocked" | "offline";
    joinedAt: string;
    totalDeliveries: number;
    rating: number;
    zone: string;
    walletBalance: number;
    vehicleType: string;
}

// Sample Data (since no riderApi is currently imported in the original)
const dummyRiders: Rider[] = [
    {
        id: 1042,
        name: "Rohan Yadav",
        contact: "+91 98765 43210",
        email: "rohan.y@fleet.local",
        status: "active",
        joinedAt: "2023-05-01",
        totalDeliveries: 1242,
        rating: 4.8,
        zone: "South Mumbai",
        walletBalance: 2450.50,
        vehicleType: "Motorcycle"
    },
    {
        id: 1089,
        name: "Kavita Rana",
        contact: "+91 91234 56789",
        email: "kavita.r@fleet.local",
        status: "blocked",
        joinedAt: "2022-11-20",
        totalDeliveries: 204,
        rating: 3.2,
        zone: "Bandra West",
        walletBalance: 120.00,
        vehicleType: "Scooter"
    },
    {
        id: 1105,
        name: "Imran Ali",
        contact: "+91 99887 76655",
        email: "imran.a@fleet.local",
        status: "offline",
        joinedAt: "2023-01-10",
        totalDeliveries: 898,
        rating: 4.9,
        zone: "Andheri East",
        walletBalance: 890.00,
        vehicleType: "Motorcycle"
    },
];

export default function RiderManagementPage() {
    const [riders, setRiders] = useState<Rider[]>(dummyRiders);
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(false);

    // Simulated fetch
    const fetchRiders = () => {
        setIsLoading(true);
        setTimeout(() => {
            setRiders([...dummyRiders]);
            setIsLoading(false);
        }, 600);
    };

    const toggleStatus = (id: number) => {
        setRiders((prev) =>
            prev.map((rider) =>
                rider.id === id
                    ? {
                        ...rider,
                        status: rider.status === "active" ? "blocked" : "active",
                    }
                    : rider
            )
        );
    };

    const filteredRiders = riders.filter((rider) => {
        const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              rider.contact.includes(searchQuery) ||
                              rider.id.toString().includes(searchQuery);
        const matchesStatus = statusFilter === "all" || rider.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "blocked": return "bg-red-50 text-red-700 border-red-200";
            case "offline": return "bg-slate-100 text-slate-700 border-slate-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Fleet Management</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Monitor, dispatch, and evaluate courier network performance.</p>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={fetchRiders}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-semibold text-sm"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Sync Telemetry
                    </button>
                </div>
            </div>

             {/* Search and Filters */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search fleet by name, ID, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold text-slate-800"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-semibold text-slate-700 min-w-[160px]"
                    >
                        <option value="all">All States</option>
                        <option value="active">Active Track</option>
                        <option value="offline">Offline</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                            <p className="text-slate-500 font-medium">Establishing secure connection to fleet nodes...</p>
                        </div>
                    ) : filteredRiders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/30">
                            <Image src="/empty_search.png" alt="No riders found" width={160} height={160} className="mb-6 opacity-90 drop-shadow-md mix-blend-multiply rounded-3xl" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No nodes located</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm border-b border-transparent">Adjust search parameters to locate couriers within the network.</p>
                        </div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Courier Identity</th>
                                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Area</th>
                                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Performance</th>
                                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Overrides</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRiders.map((rider) => (
                                    <tr key={rider.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-700 shrink-0 shadow-sm relative overflow-hidden">
                                                    <Bike size={24} className="opacity-80 absolute -right-2 -bottom-2" />
                                                    <span className="font-black text-sm relative z-10">{rider.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{rider.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                                                        <span className="text-[10px] font-black uppercase text-slate-400">ID: {rider.id}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span>{rider.contact}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-slate-400" /> {rider.zone}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                    {rider.vehicleType}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1 items-start">
                                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 w-max">
                                                    <Star size={12} className="text-amber-500 fill-amber-500" />
                                                    <span className="text-xs font-bold text-amber-900">{rider.rating.toFixed(1)}</span>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-500">
                                                    {rider.totalDeliveries.toLocaleString()} drops
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${getStatusStyle(rider.status)}`}>
                                                {rider.status === "active" ? <Activity size={12} /> : rider.status === "blocked" ? <ShieldAlert size={12} /> : <Lock size={12}/>}
                                                {rider.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleStatus(rider.id)}
                                                    className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                                                        rider.status === "active"
                                                        ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                        : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                                                    }`}
                                                    title={rider.status === "active" ? "Suspend Courier" : "Reactivate Courier"}
                                                >
                                                    {rider.status === "active" ? <Lock size={18} /> : <Unlock size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedRider(rider)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="View Telemetry"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Rider Details Executive Modal */}
            <Modal isOpen={!!selectedRider} onClose={() => setSelectedRider(null)} title="Courier Telemetry Summary">
                {selectedRider && (
                    <div className="space-y-6">
                         {/* Hero Section */}
                         <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-slate-800">
                            <div className="absolute right-0 top-0 opacity-10">
                                <Navigation size={150} className="-rotate-45 translate-x-10 -translate-y-10" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                     <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-white backdrop-blur-sm">
                                        <span className="font-black text-2xl">{selectedRider.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-2xl font-black">{selectedRider.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-white/5 ${selectedRider.status === "active" ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}`}>
                                                {selectedRider.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                                            Node ID: {selectedRider.id}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 items-center">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Wallet Reserve</p>
                                        <p className="text-xl font-black text-amber-400">{formatCurrency(selectedRider.walletBalance)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <Star size={20} className="text-amber-500 mx-auto mb-2" />
                                <p className="text-xl font-black text-slate-900">{selectedRider.rating.toFixed(1)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Global Rating</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <Package size={20} className="text-indigo-500 mx-auto mb-2" />
                                <p className="text-xl font-black text-slate-900">{selectedRider.totalDeliveries.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Drops</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <Activity size={20} className="text-emerald-500 mx-auto mb-2" />
                                <p className="text-xl font-black text-slate-900">
                                     {new Date(selectedRider.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Since</p>
                            </div>
                        </div>

                        {/* Technical Details */}
                        <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                             <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Phone size={14} /> Comm Link</span>
                                <span className="font-bold text-slate-900">{selectedRider.contact}</span>
                             </div>
                             <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Mail size={14} /> Digisignature</span>
                                <span className="font-bold text-slate-900">{selectedRider.email}</span>
                             </div>
                             <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><MapPin size={14} /> Active Sector</span>
                                <span className="font-bold text-slate-900">{selectedRider.zone}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Bike size={14} /> Transport Type</span>
                                <span className="font-bold text-slate-900">{selectedRider.vehicleType}</span>
                             </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex gap-3 pt-2">
                             <button
                                onClick={() => toggleStatus(selectedRider.id)}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold border transition-colors ${
                                    selectedRider.status === "active"
                                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-sm"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm"
                                }`}
                            >
                                {selectedRider.status === "active" ? "Suspend Operations" : "Restore Clearances"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
