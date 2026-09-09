"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Undo2 } from "lucide-react";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import StatusPill from "@/components/referrals/StatusPill";
import { Notice, EmptyState, Pager, filterClass } from "@/components/referrals/Shared";
import {
  listReferralRewards,
  reverseReferralReward,
  rewardSummary,
  formatDateTime,
  PROGRAM_TYPES,
  PROGRAM_LABELS,
  ReferralsDisabledError,
  type ReferralReward,
  type RewardFilters,
} from "@/services/referralService";

const REWARD_STATUSES = [
  "pending",
  "available",
  "used",
  "expired",
  "reversed",
  "cancelled",
] as const;

const PAGE_SIZE = 25;

export default function RewardsLedgerPage() {
  const [rows, setRows] = useState<ReferralReward[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<RewardFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<string | null>(null);

  const [reversing, setReversing] = useState<ReferralReward | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(null);
    try {
      const page = await listReferralRewards({ ...filters, limit: PAGE_SIZE, offset });
      setRows(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ReferralsDisabledError) setDisabled(err.message);
      else setError(err instanceof Error ? err.message : "Failed to load the reward ledger");
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const applyFilter = (patch: RewardFilters) => {
    setOffset(0);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const submitReversal = async () => {
    if (!reversing || reason.trim().length === 0) return;
    setSubmitting(true);
    try {
      await reverseReferralReward(reversing.reward_id, reason.trim());
      showToast("Reward reversed in the referral ledger", "success");
      setReversing(null);
      setReason("");
      await fetchRows();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reverse reward", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <Toast toast={toast} onClose={hideToast} />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Rewards Ledger
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Every referral reward issued, where it was posted, and what is left of it
        </p>
      </div>

      <ReferralTabs />

      {disabled && <Notice tone="amber" text={disabled} />}
      {error && <Notice tone="red" text={error} />}

      {!disabled && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-wrap gap-3">
            <select
              value={filters.program_type ?? ""}
              onChange={(e) =>
                applyFilter({ program_type: e.target.value as RewardFilters["program_type"] })
              }
              className={filterClass}
            >
              <option value="">All programmes</option>
              {PROGRAM_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PROGRAM_LABELS[p]}
                </option>
              ))}
            </select>
            <select
              value={filters.status ?? ""}
              onChange={(e) => applyFilter({ status: e.target.value as RewardFilters["status"] })}
              className={filterClass}
            >
              <option value="">All statuses</option>
              {REWARD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState message="No rewards have been issued yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 text-left">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Reward</th>
                    <th className="px-6 py-3">Beneficiary</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Uses</th>
                    <th className="px-6 py-3">Posted to</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Issued</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((w) => (
                    <tr key={w.reward_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-900">#{w.reward_id}</p>
                        <p className="text-xs text-slate-400">referral #{w.referral_id}</p>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-mono text-xs text-slate-600 break-all max-w-[160px]">
                          {w.beneficiary_entity_id}
                        </p>
                        <p className="text-xs text-slate-400">{w.beneficiary_role}</p>
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {rewardSummary(w.reward_type, w.amount_millis, w.percent, w.total_uses)}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {w.used_count}/{w.total_uses}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {/* A self-held discount has no external ledger; saying
                            "held in referral ledger" is more honest than
                            showing the table name back to an admin. */}
                        {!w.posted_ledger
                          ? "—"
                          : w.posted_ledger === "referral_reward_ledger"
                            ? "Held as discount"
                            : w.posted_ledger}
                      </td>
                      <td className="px-6 py-3">
                        <StatusPill status={w.status} />
                      </td>
                      <td className="px-6 py-3 text-slate-500">{formatDateTime(w.created_at)}</td>
                      <td className="px-6 py-3 text-right">
                        {w.status !== "reversed" && w.reversal_of_reward_id === null && (
                          <button
                            onClick={() => {
                              setReversing(w);
                              setReason("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <Undo2 size={13} /> Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pager total={total} offset={offset} pageSize={PAGE_SIZE} onChange={setOffset} />
        </div>
      )}

      <Modal
        isOpen={reversing !== null}
        onClose={() => (submitting ? undefined : setReversing(null))}
        title={reversing ? `Reverse reward #${reversing.reward_id}` : "Reverse reward"}
      >
        {reversing && (
          <div className="space-y-4">
            {/* The single most important thing an admin must understand before
                clicking: this is a bookkeeping entry, not a clawback. */}
            <Notice
              tone="amber"
              text="This writes a compensating entry in the referral ledger. It does not take value back out of the customer's wallet, the restaurant's billing balance or the rider's earnings — recover that separately if needed."
            />

            <p className="text-sm text-slate-600">
              {rewardSummary(
                reversing.reward_type,
                reversing.amount_millis,
                reversing.percent,
                reversing.total_uses
              )}{" "}
              · used {reversing.used_count} of {reversing.total_uses}
            </p>

            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Reason (recorded in the audit log)
              </span>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this reward being reversed?"
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setReversing(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void submitReversal()}
                disabled={submitting || reason.trim().length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                Reverse reward
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
