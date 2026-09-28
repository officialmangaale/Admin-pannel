"use client";

/** One colour vocabulary for every referral and reward state, so the same
 *  meaning reads the same way on every screen.
 *
 *  Grouped by what an admin needs to notice, not by literal state name:
 *  green = value delivered, amber = waiting or needs attention,
 *  slate = inert, red = refused or clawed back. */
const TONES: Record<string, string> = {
  // Referral lifecycle
  pending: "bg-slate-100 text-slate-600",
  qualified: "bg-blue-50 text-blue-700",
  reward_pending: "bg-amber-50 text-amber-700",
  rewarded: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-500",
  reversed: "bg-red-50 text-red-700",
  fraud_review: "bg-orange-50 text-orange-700",

  // Reward ledger
  available: "bg-emerald-50 text-emerald-700",
  used: "bg-slate-100 text-slate-600",
  cancelled: "bg-slate-100 text-slate-500",

  // Fraud queue
  open: "bg-orange-50 text-orange-700",
  approved: "bg-emerald-50 text-emerald-700",
};

export default function StatusPill({ status }: { status: string }) {
  const tone = TONES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
