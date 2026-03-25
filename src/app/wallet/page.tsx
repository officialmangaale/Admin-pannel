"use client";

import { useState } from "react";
import {
    Banknote,
    TrendingUp,
    Wallet2,
    Truck,
    Utensils,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter,
    Activity,
    CheckCircle,
    Clock,
    Search,
    AlertCircle
} from "lucide-react";
import RevenueChart from "@/components/RevenueChart";

interface Payout {
    id: string;
    type: "Restaurant" | "Rider" | "System";
    to: string;
    amount: number;
    date: string;
    status: "Completed" | "Pending" | "Failed";
}

export default function WalletPage() {
    const [searchQuery, setSearchQuery] = useState("");
    
    const [metrics] = useState([
        {
            title: "Gross Volume",
            amount: 2150000,
            icon: Banknote,
            trend: 12.5,
            isPositive: true,
            color: "emerald"
        },
        {
            title: "Net Platform Yield",
            amount: 480000,
            icon: TrendingUp,
            trend: 6.5,
            isPositive: true,
            color: "blue"
        },
        {
            title: "Courier Disbursements",
            amount: 425000,
            icon: Truck,
            trend: -2.1,
            isPositive: false,
            color: "amber"
        },
        {
            title: "Merchant Settlements",
            amount: 1120000,
            icon: Utensils,
            trend: 8.4,
            isPositive: true,
            color: "purple"
        },
        {
            title: "Held Commission",
            amount: 125000,
            icon: Wallet2,
            trend: 3.3,
            isPositive: true,
            color: "slate"
        },
    ]);

    const [recentPayouts] = useState<Payout[]>([
        {
            id: "TRX-98732A",
            type: "Restaurant",
            to: "Pizza House - Bandra",
            amount: 54000,
            date: "2025-07-28T14:30:00Z",
            status: "Completed",
        },
        {
            id: "TRX-98712B",
            type: "Rider",
            to: "Ravi Singh (Node 1045)",
            amount: 12000,
            date: "2025-07-27T09:15:00Z",
            status: "Completed",
        },
        {
            id: "TRX-98654C",
            type: "Restaurant",
            to: "Spicy Grill - Andheri",
            amount: 78000,
            date: "2025-07-25T16:45:00Z",
            status: "Pending",
        },
        {
            id: "TRX-98611D",
            type: "Rider",
            to: "Imran Ali (Node 1105)",
            amount: 5040,
            date: "2025-07-24T11:20:00Z",
            status: "Failed",
        },
    ]);

    const filteredPayouts = recentPayouts.filter(p => 
        p.to.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const getColorClass = (color: string, type: 'bg' | 'text' | 'border' | 'lightBg') => {
        const classes: Record<string, any> = {
            emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', lightBg: 'bg-emerald-50' },
            blue:    { bg: 'bg-blue-500',    text: 'text-blue-600',    border: 'border-blue-200',    lightBg: 'bg-blue-50' },
            amber:   { bg: 'bg-amber-500',   text: 'text-amber-600',   border: 'border-amber-200',   lightBg: 'bg-amber-50' },
            purple:  { bg: 'bg-purple-500',  text: 'text-purple-600',  border: 'border-purple-200',  lightBg: 'bg-purple-50' },
            slate:   { bg: 'bg-slate-700',   text: 'text-slate-700',   border: 'border-slate-200',   lightBg: 'bg-slate-100' },
        };
        return classes[color][type];
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
             <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Financial Ledger</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Real-time accounting, settlements, and platform revenue metrics.</p>
                </div>
                
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-semibold text-sm">
                        <Download size={16} /> Export Statement
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-amber-950 rounded-xl hover:bg-amber-400 transition-colors shadow-sm font-semibold text-sm">
                        <Activity size={16} /> Run Settlement Cycle
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {metrics.map((m, idx) => {
                    const Icon = m.icon;
                    return (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-500 ${getColorClass(m.color, 'bg')}`}></div>
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${getColorClass(m.color, 'lightBg')} ${getColorClass(m.color, 'border')} ${getColorClass(m.color, 'text')}`}>
                                    <Icon size={20} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border ${
                                    m.isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                    {m.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(m.trend)}%
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(m.amount)}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{m.title}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Revenue Trend Chart - Span 2 cols */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Capital Flow Analysis</h3>
                            <p className="text-sm font-medium text-slate-500">Trailing 30-day volume vs margin</p>
                        </div>
                        <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20">
                            <option>Last 30 Days</option>
                            <option>This Quarter</option>
                            <option>Year to Date</option>
                        </select>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full relative">
                        {/* 
                          We leave the existing RevenueChart component here.
                          It likely renders a Recharts line/area chart.
                        */}
                        <div className="absolute inset-x-0 bottom-0 h-full w-full opacity-90">
                            <RevenueChart />
                        </div>
                    </div>
                </div>

                {/* Ledger Summary / Quick Actions - Span 1 col */}
                <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6 text-amber-500">
                            <Wallet2 size={20} />
                            <h3 className="font-bold tracking-widest text-xs uppercase">Treasury Vault</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">Available Liquidity</p>
                                <h4 className="text-4xl font-black text-white">{formatCurrency(3450000)}</h4>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400 font-medium">Pending Settlements</span>
                                    <span className="text-sm font-bold text-amber-400">{formatCurrency(145000)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400 font-medium">Frozen Capital</span>
                                    <span className="text-sm font-bold text-slate-300">{formatCurrency(52000)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 pt-6 border-t border-slate-800">
                        <button className="w-full py-3.5 bg-amber-500 text-amber-950 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            Authorize Disbursements
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Payouts Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                        <h3 className="text-lg font-bold text-slate-900">Transaction Ledger</h3>
                        <p className="text-sm font-medium text-slate-500">Recent outbound capital movements</p>
                    </div>
                    <div className="flex gap-3">
                         <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search TRX ID or Payee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold"
                            />
                        </div>
                        <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors font-semibold shadow-sm text-sm flex items-center gap-2">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Reference ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Classification</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Beneficiary</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Settlement Value</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500 font-medium text-sm">
                                        No transactions match the current query.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-slate-900 font-mono text-sm">{p.id}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                {p.type === 'Restaurant' ? <Utensils size={10} /> : p.type === 'Rider' ? <Truck size={10} /> : <Activity size={10} />}
                                                {p.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-semibold text-sm text-slate-700">{p.to}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="font-black text-sm text-slate-900">{formatCurrency(p.amount)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-medium text-slate-500">{formatDate(p.date)}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                                                p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                p.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {p.status === 'Completed' ? <CheckCircle size={12} /> : 
                                                 p.status === 'Pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
