"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export interface RevenueTrendPoint {
    date: string;
    amount: number;
}

export default function RevenueChart({ data }: { data: RevenueTrendPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#facc15"
                    strokeWidth={3}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
