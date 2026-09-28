"use client";

import { AlertCircle } from "lucide-react";

/** Pieces shared by the five referral screens. Kept out of the page files so
 *  App Router pages export only their default component. */

export function Notice({ tone, text }: { tone: "amber" | "red"; text: string }) {
  const styles =
    tone === "amber"
      ? "bg-amber-50/70 border-amber-200/70 text-amber-900"
      : "bg-red-50/70 border-red-200/70 text-red-900";
  return (
    <div className={`border rounded-2xl p-5 flex gap-3 ${styles}`}>
      <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-slate-400 py-16 text-sm">{message}</p>;
}

export function Pager({
  total,
  offset,
  pageSize,
  onChange,
}: {
  total: number;
  offset: number;
  pageSize: number;
  onChange: (next: number) => void;
}) {
  if (total <= pageSize) return null;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-sm">
      <span className="text-slate-500">
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(0, offset - pageSize))}
          disabled={offset === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-200 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onChange(offset + pageSize)}
          disabled={to >= total}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-200 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-slate-800 mt-0.5 ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</p>
    </div>
  );
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="font-bold text-slate-900 mb-3">{title}</p>
      {children}
    </div>
  );
}

export const filterClass =
  "px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm";
