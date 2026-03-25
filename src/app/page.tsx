"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, AlertCircle, RefreshCw, TrendingUp, TrendingDown, 
  IndianRupee, ShoppingBag, Store, Users, Activity, ChevronRight,
  Clock, CheckCircle, XCircle 
} from "lucide-react";
import RevenueChart from "../components/RevenueChart";
import { adminApi, AdminDashboardData } from "@/lib/api";

export default function Dashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboardStats();
      if (response?.data) {
        setData(response.data);
      } else {
        setError("Invalid response format from server.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
        <div className="p-8 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            <p className="text-slate-500 font-medium animate-pulse">Loading execution dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-3xl flex flex-col items-center justify-center min-h-[50vh] text-center shadow-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-red-900 mb-2">System Error</h3>
        <p className="text-red-600 mb-8 max-w-md">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 font-semibold shadow-md shadow-red-500/20 transition-all hover:-translate-y-0.5"
        >
          <RefreshCw size={18} /> Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">Executive Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Platform overview and operational analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200/60">
            {['today', '7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                  dateRange === range 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={fetchDashboard}
            className="p-2.5 bg-white text-slate-600 border border-slate-200/60 rounded-xl hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm flex items-center justify-center"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-900/10 border border-slate-700 text-white group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
              <IndianRupee size={22} className="text-amber-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
              <TrendingUp size={12} /> +12.5%
            </span>
          </div>
          <div className="relative z-10 block">
            <p className="text-slate-400 text-sm font-medium tracking-wide mb-1">Platform Revenue</p>
            <h3 className="text-4xl font-black tracking-tight">{formatCurrency(data.total_revenue)}</h3>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium tracking-wide mb-1">Total Orders</p>
            <h3 className="text-3xl font-bold text-slate-900">{data.total_orders.toLocaleString()}</h3>
          </div>
        </div>

        {/* AOV Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <Activity size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium tracking-wide mb-1">Avg Order Value</p>
            <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(data.average_order_value)}</h3>
          </div>
        </div>

        {/* Daily Orders Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform duration-300">
              <Clock size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium tracking-wide mb-1">Avg Daily Orders</p>
            <h3 className="text-3xl font-bold text-slate-900">{data.average_daily_orders.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Room */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: "Total Restaurants", value: data.total_restaurants, icon: <Store className="opacity-20 absolute -right-2 -bottom-2 w-16 h-16" />, color: "bg-blue-50/50" },
          { title: "Active Recent (7d)", value: data.recent_restaurants, color: "bg-emerald-50/50" },
          { title: "Needs Registration", value: data.unregistered_restaurants, color: "bg-orange-50/50 text-orange-900" },
          { title: "Missing Qrunch", value: data.no_qrunch_restaurants, color: "bg-slate-50/80" },
          { title: "Qrunch Requests", value: data.qrunch_requested_restaurants, color: "bg-purple-50/50 text-purple-900" },
        ].map((m, i) => (
          <div key={i} className={`relative overflow-hidden p-5 rounded-2xl border border-slate-200/60 ${m.color} hover:-translate-y-1 transition-transform duration-300 cursor-default`}>
            {m.icon}
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{m.title}</p>
              <p className="text-xl font-bold text-slate-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Charts & Graph) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                <p className="text-sm text-slate-500 font-medium">Platform revenue over the selected period</p>
              </div>
              <button className="text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors">Detailed Report</button>
            </div>
            
            <div className="h-[320px] w-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100/80">
              {data.revenue_trend && data.revenue_trend.length > 0 ? (
                // In a real app we'd pass data.revenue_trend to <RevenueChart />
                <RevenueChart />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Activity size={32} className="mb-3 opacity-50" />
                  <p className="font-medium">No revenue data available for trending chart</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                <p className="text-sm text-slate-500 font-medium">Latest orders across the platform</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                    <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recent_orders && data.recent_orders.length > 0 ? (
                    data.recent_orders.slice(0, 5).map((r) => (
                      <tr key={r.order_id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-2 text-sm font-semibold text-slate-900">#{r.order_id}</td>
                        <td className="py-4 px-2 text-sm font-medium text-slate-600">{r.customer_name}</td>
                        <td className="py-4 px-2 text-sm font-bold text-slate-900 text-right">{formatCurrency(r.amount)}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg ${
                            r.status.toLowerCase() === "delivered" ? "bg-emerald-100 text-emerald-800" :
                            r.status.toLowerCase() === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <ShoppingBag className="w-10 h-10 mb-3 text-slate-200" />
                          <p className="font-medium text-sm">No recent orders found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Top Dishes & Action Items) */}
        <div className="space-y-8">
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sm:p-8 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Top Dishes</h3>
                <p className="text-sm text-slate-500 font-medium">Highest grossing items</p>
              </div>
            </div>
            
            {data.top_dishes && data.top_dishes.length > 0 ? (
              <ul className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {data.top_dishes.map((dish) => (
                  <li key={dish.id} className="flex items-center justify-between p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl transition-all group">
                    <div className="flex items-center space-x-4">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center border border-slate-200/60">No Img</div>
                      )}
                      <div>
                        <span className="text-slate-900 font-bold block text-sm group-hover:text-amber-600 transition-colors">{dish.name}</span>
                        <span className="text-slate-500 font-medium text-sm">{formatCurrency(dish.price)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md mb-1">
                        <TrendingUp size={12} /> {dish.growth_percentage}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-medium text-sm">Not enough data to determine top dishes.</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-lg border border-orange-400 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="text-lg font-bold mb-2 relative z-10">Operational Insights</h3>
            <p className="text-orange-100 text-sm font-medium mb-6 relative z-10">2 Action items require attention</p>
            
            <div className="space-y-3 relative z-10">
              <div className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 transition-colors cursor-pointer flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertCircle size={18} className="text-orange-200" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Payouts Pending</p>
                  <p className="text-xs text-orange-100 mt-1">12 restaurants await settlement</p>
                </div>
              </div>
              <div className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 transition-colors cursor-pointer flex items-start gap-3">
                <div className="mt-0.5">
                  <XCircle size={18} className="text-orange-200" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Verification Needed</p>
                  <p className="text-xs text-orange-100 mt-1">5 new drivers uploaded KYC</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


