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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                    <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Initializing Workspace...</p>
                </div>
            </div>
        );
    }

    // Don't show sidebar/header on login page or if not authenticated
    if (pathname === '/login' || !isAuthenticated) {
        return <div className="min-h-screen bg-slate-50">{children}</div>;
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900 font-sans">
            <AdminSidebar open={open} onClose={() => setOpen(false)} />
            <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-h-screen">
                <Header onMenuClick={() => setOpen(true)} />
                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 space-y-8 overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
                    {children}
                </main>
            </div>
        </div>
    );
}
