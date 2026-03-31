"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, Store, MapPin, Phone, Mail, Clock, Calendar, 
    CheckCircle2, AlertCircle, ShoppingBag, Wallet, FileText, 
    Settings, Star, Tag, QrCode, Shield, Activity, Share2, Copy, FileCheck, Download
} from "lucide-react";
import { restaurantApi, Restaurant } from "@/lib/api";
import BillingTab from "@/components/billing/BillingTab";

const tabs = [
    { id: "overview", label: "Overview", icon: Store },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "wallet", label: "Wallet & Billing", icon: Wallet },
    { id: "menu", label: "Menu", icon: FileText },
    { id: "owner", label: "Owner Account", icon: Shield },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "qr", label: "QR & Table", icon: QrCode },
    { id: "kyc", label: "KYC Documents", icon: Shield },
    { id: "history", label: "Activity History", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function RestaurantDetails() {
    const params = useParams();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const fetchDetails = async () => {
            if (!params.id) return;
            try {
                const res = await restaurantApi.getById(Number(params.id));
                if (res?.data) {
                    setRestaurant(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
                <div className="p-8 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading restaurant profile...</p>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center min-h-[50vh] flex flex-col items-center justify-center">
                <Store size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Restaurant Not Found</h2>
                <p className="text-slate-500 mt-2 mb-6">The restaurant you are looking for does not exist or has been removed.</p>
                <button 
                    onClick={() => router.push('/restaurants')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium"
                >
                    <ArrowLeft size={18} /> Back to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => router.push('/restaurants')}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex gap-2">
                    <button className="p-2 bg-white text-slate-500 hover:text-amber-600 rounded-xl shadow-sm border border-slate-200 transition-colors" title="Share Profile">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Profile Header (Sticky) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sm:p-8 sticky top-24 z-20 overflow-hidden relative">
                {/* Dynamic Background Image */}
                {restaurant.background_url && (
                    <div 
                        className="absolute inset-x-0 top-0 h-32 bg-cover bg-center opacity-20" 
                        style={{ backgroundImage: `url(${restaurant.background_url})` }}
                    />
                )}
                
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10 pt-4">
                    <div className="relative">
                        {restaurant.logo_url ? (
                            <img src={restaurant.logo_url} alt={restaurant.name} className="w-28 h-28 object-cover rounded-2xl shadow-sm border border-slate-100 bg-white" />
                        ) : (
                            <div className="w-28 h-28 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                                <Store size={40} className="text-amber-400" />
                            </div>
                        )}
                        <span className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-lg text-xs font-bold border-2 border-white shadow-sm ${
                            restaurant.status === 'active' || restaurant.status === 'OPEN' ? 'bg-emerald-500 text-white' : 
                            restaurant.status === 'closed' || restaurant.status === 'CLOSED' ? 'bg-red-500 text-white' : 
                            'bg-amber-500 text-white'
                        }`}>
                            {restaurant.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{restaurant.name}</h1>
                                <p className="flex items-center gap-1.5 text-slate-500 mt-1 font-medium text-sm">
                                    <MapPin size={16} className="text-slate-400" /> 
                                    {restaurant.address || restaurant.street_address ? 
                                        `${restaurant.address || restaurant.street_address}, ${restaurant.city}, ${restaurant.state} ${restaurant.pincode || ''}` : 
                                        'Address not provided'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {restaurant.is_restaurant_registered && (
                                    <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                        <CheckCircle2 size={14} /> FSSAI Verified
                                    </span>
                                )}
                                {restaurant.is_qrunch_purchased && (
                                    <span className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">
                                        <QrCode size={14} /> Qrunch Pro
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 pt-5 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" />
                                <span className="font-medium">{restaurant.owner_phone || restaurant.phone || 'N/A'}</span>
                            </div>
                            {restaurant.owner_name && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail size={16} className="text-slate-400" />
                                <span className="font-medium">{restaurant.owner_email || `Owner: ${restaurant.owner_name}`}</span>
                            </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock size={16} className="text-slate-400" />
                                <span className="font-medium">Joined {restaurant.created_at ? new Date(restaurant.created_at).toLocaleDateString() : 'Recently'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-xs shadow-sm">
                                    ID: {restaurant.id}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="flex flex-col lg:flex-row gap-8 mt-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-3 sticky top-[280px]">
                        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                                            isActive 
                                                ? 'bg-amber-50 text-amber-700 shadow-sm' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon size={18} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sm:p-8 min-h-[500px]">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Performance Overview</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <ShoppingBag size={24} className="text-indigo-500 mb-3" />
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Orders</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{restaurant.total_orders?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Activity size={24} className="text-emerald-500 mb-3" />
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Lifetime Revenue</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">₹{restaurant.total_sales?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Wallet size={24} className="text-amber-500 mb-3" />
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Pending Settlement</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">₹{restaurant.pending_settlements?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mt-10">Business Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Legal Name</p>
                                    <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                        {restaurant.name}
                                        <button className="text-slate-400 hover:text-amber-600"><Copy size={14}/></button>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">FSSAI License</p>
                                    <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                        {restaurant.fssai_number || 'Not Provided'}
                                        {restaurant.fssai_number && <button className="text-slate-400 hover:text-amber-600"><Copy size={14}/></button>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GST Number</p>
                                    <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                        {restaurant.gst_number || 'Not Configured'}
                                        {restaurant.gst_number && <button className="text-slate-400 hover:text-amber-600"><Copy size={14}/></button>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform Fee</p>
                                    <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                        {restaurant.commission_rate || 0}% per order
                                        <button className="text-slate-400 hover:text-amber-600"><Settings size={14}/></button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'kyc' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Verification Documents</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {restaurant.fssai_license_url && (
                                    <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                                            <FileCheck size={28} />
                                        </div>
                                        <h3 className="font-bold text-slate-800">FSSAI License</h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-4">{restaurant.fssai_number || 'Valid'}</p>
                                        <a href={restaurant.fssai_license_url} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                                            <Download size={16} /> View Document
                                        </a>
                                    </div>
                                )}
                                {restaurant.pan_card_url && (
                                    <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
                                            <FileText size={28} />
                                        </div>
                                        <h3 className="font-bold text-slate-800">PAN Card</h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-4">Identity Proof</p>
                                        <a href={restaurant.pan_card_url} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                                            <Download size={16} /> View Document
                                        </a>
                                    </div>
                                )}
                                {restaurant.aadhaar_card_url && (
                                    <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                                            <Shield size={28} />
                                        </div>
                                        <h3 className="font-bold text-slate-800">Aadhaar Card</h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-4">Address Proof</p>
                                        <a href={restaurant.aadhaar_card_url} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                                            <Download size={16} /> View Document
                                        </a>
                                    </div>
                                )}
                                {restaurant.gst_certificate_url && (
                                    <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
                                            <FileText size={28} />
                                        </div>
                                        <h3 className="font-bold text-slate-800">GST Certificate</h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-4">{restaurant.gst_number || 'Valid'}</p>
                                        <a href={restaurant.gst_certificate_url} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                                            <Download size={16} /> View Document
                                        </a>
                                    </div>
                                )}
                                {!restaurant.fssai_license_url && !restaurant.pan_card_url && !restaurant.aadhaar_card_url && !restaurant.gst_certificate_url && (
                                    <div className="col-span-full py-12 flex flex-col items-center">
                                        <AlertCircle size={40} className="text-slate-300 mb-3" />
                                        <h3 className="text-lg font-bold text-slate-700">No Documents Uploaded</h3>
                                        <p className="text-slate-500 text-sm max-w-sm text-center mt-2">This partner has not provided any KYC or business verification documents yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'wallet' && restaurant && (
                        <BillingTab restaurantId={restaurant.id} />
                    )}

                    {activeTab !== 'overview' && activeTab !== 'kyc' && activeTab !== 'wallet' && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
                                <Settings size={32} className="text-amber-400" />
                            </div>
                            <p className="text-slate-500 max-w-sm">
                                This section is currently under construction. Future updates will bring detailed management for this module.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
