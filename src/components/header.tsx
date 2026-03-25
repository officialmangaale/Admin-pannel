'use client';
import { Menu, Search, Bell, Settings as Gear, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 h-20 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center flex-1">
                <button 
                    className="mr-5 lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" 
                    onClick={onMenuClick}
                >
                    <Menu size={22} />
                </button>
                <div className="relative w-full max-w-md hidden md:block group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search operations, restaurants, or users..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden lg:inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-sm">⌘K</kbd>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-6">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse border-2 border-white"></span>
                </button>
                
                <div className="hidden sm:block w-px h-8 bg-slate-200/60"></div>
                
                <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors">{user?.full_name || 'Admin'}</span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{user?.primary_role || 'Super Admin'}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-200 text-amber-700 flex items-center justify-center shadow-sm overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=fef3c7&color=b45309&bold=true" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    
                    <button
                        onClick={logout}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}