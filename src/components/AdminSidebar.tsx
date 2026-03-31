"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Store, Menu as MenuIcon, Eye, Calendar, Wallet, Settings, X, User, Bike, CreditCard } from "lucide-react";

export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname();
    
    const items = [
        { href: "/", label: "Dashboard", icon: <Home size={20} /> },
        { href: "/orders", label: "Orders", icon: <ShoppingBag size={20} /> },
        { href: "/restaurants", label: "Restaurants", icon: <Store size={20} /> },
        { href: "/users", label: "Users", icon: <User size={20} /> },
        { href: "/riders", label: "Riders", icon: <Bike size={20} /> },
        { href: "/wallet", label: "Wallet", icon: <Wallet size={20} /> },
        { href: "/history", label: "History", icon: <Eye size={20} /> },
        { href: "/calendar", label: "Calendar", icon: <Calendar size={20} /> },
        { href: "/settings", label: "Settings", icon: <Settings size={20} /> },
    ];

    const billingItems = [
        { href: "/billing/plans", label: "Plans", icon: <CreditCard size={20} /> },
    ];

    return (
        <>
            {open && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={onClose} />}
            <aside className={`fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
                <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100/80">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                            <Store className="text-white" size={18} />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Mangaale</h1>
                    </div>
                    <button className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1 scrollbar-hide">
                    <p className="px-4 text-xs font-semibold text-slate-400 tracking-wider uppercase mb-4 mt-2">Operations</p>
                    {items.map((it) => {
                        const isActive = pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
                        return (
                            <Link key={it.href} href={it.href} className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-amber-50/80 text-amber-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                <span className={`transition-colors duration-200 ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                    {it.icon}
                                </span>
                                <span className={`ml-3 text-sm tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {it.label}
                                </span>
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <p className="px-4 text-xs font-semibold text-slate-400 tracking-wider uppercase mb-4 mt-2">Billing</p>
                        {billingItems.map((it) => {
                            const isActive = pathname === it.href || pathname?.startsWith(it.href);
                            return (
                                <Link key={it.href} href={it.href} className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-amber-50/80 text-amber-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {it.icon}
                                    </span>
                                    <span className={`ml-3 text-sm tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                        {it.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
                
                <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-slate-700">A</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Admin User</p>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
