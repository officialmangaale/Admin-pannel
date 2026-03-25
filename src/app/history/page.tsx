"use client";

import { useState } from "react";
import { 
    Activity, Clock, User, ShieldAlert, LogIn, Edit, Trash2, ShieldCheck, 
    Filter, Search, Download, Calendar, Server, MapPin
} from "lucide-react";
import classNames from "classnames";

interface AuditLog {
    id: string;
    actionType: "login" | "modify" | "delete" | "security" | "system";
    actor: { name: string; role: string; email: string };
    target: string;
    details: string;
    timestamp: string;
    ipAddress: string;
    status: "success" | "warning" | "failed";
}

const dummyLogs: AuditLog[] = [
    {
        id: "AL-893321",
        actionType: "security",
        actor: { name: "System Admin", role: "Super Admin", email: "admin@domain.com" },
        target: "Global Security Policy",
        details: "Elevated access privileges for role: 'Regional Manager'.",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.104",
        status: "warning",
    },
    {
        id: "AL-893320",
        actionType: "modify",
        actor: { name: "Sarah Ahmed", role: "Manager", email: "sarah.a@domain.com" },
        target: "Restaurant ID: 1045",
        details: "Changed operational status from 'Active' to 'Maintenance'.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: "10.0.0.51",
        status: "success",
    },
    {
        id: "AL-893319",
        actionType: "delete",
        actor: { name: "John Doe", role: "Admin", email: "john.d@domain.com" },
        target: "User Profile: ID 883",
        details: "Permanently deleted user record.",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        ipAddress: "192.168.1.109",
        status: "success",
    },
    {
        id: "AL-893318",
        actionType: "login",
        actor: { name: "Unknown Entity", role: "Unauthenticated", email: "N/A" },
        target: "Admin Portal",
        details: "Failed login attempt. Invalid credentials provided 3 times.",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        ipAddress: "45.12.33.191",
        status: "failed",
    },
    {
        id: "AL-893317",
        actionType: "system",
        actor: { name: "Automated CRON", role: "System Service", email: "cron@internal" },
        target: "Database Indexer",
        details: "Successfully rebuilt spatial indexes for delivery zones.",
        timestamp: new Date(Date.now() - 90000000).toISOString(),
        ipAddress: "127.0.0.1",
        status: "success",
    },
];

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [logs] = useState<AuditLog[]>(dummyLogs);

    const getIconPrefix = (type: AuditLog['actionType']) => {
        switch (type) {
            case "login": return <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600"><LogIn size={18} /></div>;
            case "modify": return <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-600"><Edit size={18} /></div>;
            case "delete": return <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-600"><Trash2 size={18} /></div>;
            case "security": return <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-600"><ShieldCheck size={18} /></div>;
            case "system": return <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600"><Server size={18} /></div>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const filteredLogs = logs.filter(log => 
        log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Audit Trail</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Immutable chronology of system events, security changes, and operations.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold shadow-sm text-sm">
                        <Filter size={16} /> Advanced Filter
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm font-semibold text-sm">
                        <Download size={16} /> Export SEC LOG
                    </button>
                </div>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Lateral Panel */}
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                        <div className="relative group mb-5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search event syntax..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold"
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Classification</h4>
                            {[
                                { label: "Authentication Ops", count: 142, color: "bg-blue-500" },
                                { label: "Data Modifications", count: 89, color: "bg-amber-500" },
                                { label: "Deletions / Purges", count: 12, color: "bg-red-500" },
                                { label: "Security Policy", count: 4, color: "bg-purple-500" },
                            ].map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center group cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{cat.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 relative overflow-hidden">
                        <ShieldAlert size={80} className="absolute -right-6 -bottom-6 text-amber-500 opacity-10" />
                        <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                            <Activity size={16} /> Compliance Active
                        </h4>
                        <p className="text-xs font-medium text-amber-800 leading-relaxed mb-4">
                            Logs are cryptographically signed and retained for 3 years in accordance with enterprise data retention policies.
                        </p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-6 md:p-8">
                        <div className="relative border-l-2 border-slate-100 ml-4 lg:ml-6 space-y-10">
                            {filteredLogs.map((log, idx) => (
                                <div key={log.id} className="relative pl-8 md:pl-10 group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                                    {/* Icon connector */}
                                    <div className="absolute -left-[21px] top-1 bg-white p-1 rounded-full group-hover:scale-110 transition-transform">
                                        {getIconPrefix(log.actionType)}
                                    </div>
                                    
                                    {/* Log Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{log.id}</span>
                                            <span className={classNames(
                                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded border tracking-wider",
                                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                log.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-rose-50 text-rose-700 border-rose-200'
                                            )}>
                                                {log.status} Phase
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <Clock size={14} /> {formatDate(log.timestamp)}
                                        </div>
                                    </div>

                                    {/* Log Content Card */}
                                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 group-hover:bg-slate-50 group-hover:border-slate-200 transition-colors">
                                        <p className="text-sm font-semibold text-slate-800 mb-4">{log.details}</p>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-4 border-t border-slate-200/60">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                                    <User size={12} /> Execution Principal
                                                </p>
                                                <p className="text-sm font-bold text-slate-900">{log.actor.name}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">{log.actor.role} • {log.actor.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                                    <Server size={12} /> Target Context
                                                </p>
                                                <p className="text-sm font-bold text-slate-900">{log.target}</p>
                                            </div>
                                            <div className="sm:ml-auto text-right">
                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-end gap-1">
                                                    <MapPin size={12} /> Origin Node
                                                </p>
                                                <p className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200/60 inline-block shadow-sm">
                                                    {log.ipAddress}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredLogs.length === 0 && (
                                <div className="pl-8 text-center py-12">
                                     <p className="text-slate-400 font-medium text-sm">No historical records match the provided decryption key.</p>
                                </div>
                            )}

                             {filteredLogs.length > 0 && (
                                <div className="pl-8 pt-6">
                                    <button className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-2">
                                        Extract Deeper Records <Activity size={16} />
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
