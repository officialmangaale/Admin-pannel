"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { X, Upload, Save, Store, MapPin, FileCheck, Loader2 } from "lucide-react";
import { restaurantApi, Restaurant, UpdateRestaurantRequest, UpdateRestaurantFiles } from "@/lib/api";

interface EditRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    onSuccess: () => void;
}

export default function EditRestaurantModal({ isOpen, onClose, restaurant, onSuccess }: EditRestaurantModalProps) {
    const [activeTab, setActiveTab] = useState("basic");
    const [loading, setLoading] = useState(false);
    const [fetchingFullInfo, setFetchingFullInfo] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState<Partial<UpdateRestaurantRequest>>({
        name: "",
        status: "active",
        city: "",
        state: "",
        pincode: "",
        street_address: "",
        commission_rate: 0,
        delivery_radius: 0,
        is_qrunch_purchased: false,
        is_qrunch_requested: false,
        is_restaurant_registered: false,
    });

    // Fetch full restaurant details upon opening
    useEffect(() => {
        if (isOpen && restaurant) {
            setFetchingFullInfo(true);
            restaurantApi.getById(restaurant.id)
                .then((res) => {
                    const fullRes = res.data || restaurant;
                    setFormData({
                        name: fullRes.name || "",
                        status: fullRes.status || "active",
                        city: fullRes.city || "",
                        state: fullRes.state || "",
                        pincode: fullRes.pincode || "",
                        street_address: fullRes.street_address || fullRes.address || "",
                        commission_rate: fullRes.commission_rate || 0,
                        delivery_radius: fullRes.delivery_radius || 0,
                        is_qrunch_purchased: fullRes.is_qrunch_purchased || false,
                        is_qrunch_requested: fullRes.is_qrunch_requested || false,
                        is_restaurant_registered: fullRes.is_restaurant_registered || false,
                    });
                })
                .catch((err) => {
                    console.error("Failed to fetch full restaurant details for edit", err);
                    // Fallback to the partial list object if fetch fails
                    setFormData({
                        name: restaurant.name || "",
                        status: restaurant.status || "active",
                        city: restaurant.city || "",
                        state: restaurant.state || "",
                        street_address: restaurant.street_address || restaurant.address || "",
                    });
                    setError("Could not load complete data. Some fields may be missing.");
                })
                .finally(() => setFetchingFullInfo(false));
            setFiles({});
        }
    }, [isOpen, restaurant]);

    // File states
    const [files, setFiles] = useState<Partial<UpdateRestaurantFiles>>({});

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, key: keyof UpdateRestaurantFiles) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant) return;
        setLoading(true);
        setError(null);

        try {
            await restaurantApi.patch(restaurant.id, formData, files);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update restaurant.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !restaurant) return null;

    const tabs = [
        { id: "basic", label: "Basic Info", icon: Store },
        { id: "location", label: "Location", icon: MapPin },
        { id: "files", label: "Documents", icon: FileCheck },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Edit Partner</h2>
                        <p className="text-sm text-slate-500 mt-1">Updating {restaurant.name}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-8 pt-4 border-b border-slate-100 bg-slate-50/50 flex gap-6">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                type="button"
                                className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${
                                    active ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form */}
                <form id="edit-restaurant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {fetchingFullInfo ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <Loader2 size={32} className="animate-spin text-amber-500" />
                            <p className="text-slate-500 font-medium">Loading full configuration...</p>
                        </div>
                    ) : (
                    <div className="space-y-6">
                        {activeTab === "basic" && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Restaurant Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleTextChange} 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                        <select 
                                            name="status" 
                                            value={formData.status} 
                                            onChange={handleTextChange} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                        >
                                            <option value="active">Active (OPEN)</option>
                                            <option value="closed">Closed</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Commission Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="commission_rate" 
                                            value={formData.commission_rate} 
                                            onChange={handleTextChange} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900">Registered Restaurant</h4>
                                            <p className="text-xs text-slate-500 mt-1">Verified FSSAI / Legal entity</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                name="is_restaurant_registered" 
                                                checked={formData.is_restaurant_registered || false} 
                                                onChange={handleTextChange} 
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                        </label>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900">Qrunch Capabilities (Purchased)</h4>
                                            <p className="text-xs text-slate-500 mt-1">Has full digital table-ordering access</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                name="is_qrunch_purchased" 
                                                checked={formData.is_qrunch_purchased || false} 
                                                onChange={handleTextChange} 
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                        </label>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900">Qrunch Requested</h4>
                                            <p className="text-xs text-slate-500 mt-1">Partner has requested Qrunch integration</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                name="is_qrunch_requested" 
                                                checked={formData.is_qrunch_requested || false} 
                                                onChange={handleTextChange} 
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "location" && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Street Address</label>
                                    <input 
                                        type="text" 
                                        name="street_address" 
                                        value={formData.street_address} 
                                        onChange={handleTextChange} 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                                        <input 
                                            type="text" 
                                            name="city" 
                                            value={formData.city} 
                                            onChange={handleTextChange} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                                        <input 
                                            type="text" 
                                            name="state" 
                                            value={formData.state} 
                                            onChange={handleTextChange} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Pincode</label>
                                        <input 
                                            type="text" 
                                            name="pincode" 
                                            value={formData.pincode} 
                                            onChange={handleTextChange} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Delivery Radius (km)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="delivery_radius" 
                                            value={formData.delivery_radius} 
                                            onChange={handleTextChange} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "files" && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <p className="text-sm text-slate-500 mb-4 bg-blue-50 text-blue-800 p-3 rounded-xl font-medium border border-blue-100">
                                    Upload new files to replace existing documents. Unchanged files will be preserved.
                                </p>

                                {[
                                    { key: "logo_url", label: "Logo Image" },
                                    { key: "background_url", label: "Cover/Background" },
                                    { key: "fssai_license_url", label: "FSSAI License" },
                                    { key: "gst_certificate_url", label: "GST Certificate" },
                                    { key: "pan_card_url", label: "PAN Card" },
                                    { key: "aadhaar_card_url", label: "Aadhaar Card" }
                                ].map(({ key, label }) => (
                                    <div key={key} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{label}</h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {files[key as keyof UpdateRestaurantFiles] ? files[key as keyof UpdateRestaurantFiles]?.name : "No new file selected"}
                                            </p>
                                        </div>
                                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm">
                                            <Upload size={16} /> Choose File
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                onChange={(e) => handleFileChange(e, key as keyof UpdateRestaurantFiles)}
                                                accept="image/*,.pdf"
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    )}
                </form>

                {/* Footer Controls */}
                <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="edit-restaurant-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {loading ? "Saving Changes..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
