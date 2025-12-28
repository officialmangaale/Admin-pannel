"use client";
import { ReactNode, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import Header from "./header";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    // Don't show sidebar/header on login page or if not authenticated
    if (pathname === '/login' || !isAuthenticated) {
        return <div className="min-h-screen bg-gray-50 dark:bg-slate-950">{children}</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <AdminSidebar open={open} onClose={() => setOpen(false)} />
            <div className="flex-1 flex flex-col lg:pl-60 transition-all duration-300">
                <Header onMenuClick={() => setOpen(true)} />
                {/* Main Content */}
                <main className="p-6 space-y-6 overflow-auto animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
