'use client';
import { Menu, Search, Bell, Settings as Gear, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
                <button className="mr-4 lg:hidden text-gray-600" onClick={onMenuClick}>
                    <Menu />
                </button>
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    />
                </div>
            </div>
            <div className="flex items-center space-x-6">
                <button className="relative text-gray-500 hover:text-orange-500 transition-colors">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
                </button>
                <div className="flex items-center space-x-4 border-l pl-6">
                    <div className="flex flex-col items-end mr-2 text-right">
                        <span className="text-sm font-bold text-gray-900 leading-tight">{user?.full_name || 'Admin'}</span>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{user?.primary_role || 'Admin'}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <User size={20} />
                    </div>
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}