"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import RevenueChart from "../components/RevenueChart";
import { adminApi, AdminDashboardData } from "@/lib/api";

export default function Dashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center min-h-[40vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform overview and statistics</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Top metrics - Revenue & Orders row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: formatCurrency(data.total_revenue) },
          { title: "Total Orders", value: data.total_orders.toString() },
          { title: "Avg Order Value", value: formatCurrency(data.average_order_value) },
          { title: "Avg Daily Orders", value: data.average_daily_orders.toString() },
        ].map((m) => (
          <div key={m.title} className="p-4 bg-white rounded-xl shadow flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{m.title}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Restaurant metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "Total Restaurants", value: data.total_restaurants },
          { title: "Recent (7d)", value: data.recent_restaurants },
          { title: "Unregistered", value: data.unregistered_restaurants },
          { title: "No Qrunch", value: data.no_qrunch_restaurants },
          { title: "Qrunch Requested", value: data.qrunch_requested_restaurants },
        ].map((m) => (
          <div key={m.title} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{m.title}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Chart & Top dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl shadow min-h-[320px] flex flex-col">
          <h3 className="text-gray-800 font-semibold mb-4">Revenue Trend</h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-100 p-4">
            {data.revenue_trend && data.revenue_trend.length > 0 ? (
               // In a real app we'd pass data.revenue_trend to <RevenueChart />
               <RevenueChart />
            ) : (
               <div className="text-center">
                 <p>No revenue data available for trending chart</p>
               </div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow min-h-[320px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-800 font-semibold">Top Selling Dishes</h3>
            {data.top_dishes && data.top_dishes.length > 0 && (
              <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">View all</button>
            )}
          </div>
          
          {data.top_dishes && data.top_dishes.length > 0 ? (
            <ul className="flex-1 overflow-y-auto space-y-4 pr-2">
              {data.top_dishes.map((dish) => (
                <li key={dish.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-4">
                    {dish.image_url ? (
                      <img src={dish.image_url} alt={dish.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center border">No Img</div>
                    )}
                    <div>
                      <span className="text-gray-900 font-medium block">{dish.name}</span>
                      <span className="text-gray-500 text-sm">{formatCurrency(dish.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 px-2 py-1 rounded">
                    <TrendingUp size={14} className="text-green-600" />
                    <span className="text-green-700 text-sm font-medium">{dish.growth_percentage}%</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg p-6 text-center">
              <p>Not enough order data to determine top dishes yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="p-6 bg-white rounded-xl shadow">
        <h3 className="text-gray-800 font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recent_orders && data.recent_orders.length > 0 ? (
                data.recent_orders.map((r) => (
                  <tr key={r.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{r.order_id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{r.customer_name}</td>
                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(r.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        r.status.toLowerCase() === "delivered" ? "bg-green-100 text-green-700" :
                        r.status.toLowerCase() === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

