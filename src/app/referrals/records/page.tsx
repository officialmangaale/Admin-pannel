"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import Modal from "@/components/Modal";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import StatusPill from "@/components/referrals/StatusPill";
import { Notice, EmptyState, Pager, Detail, Block, filterClass } from "@/components/referrals/Shared";
import {
  listReferralRecords,
  getReferralRecord,
  formatDateTime,
  rewardSummary,
  PROGRAM_TYPES,
  PROGRAM_LABELS,
  ReferralsDisabledError,
  type ReferralRecord,
  type ReferralRecordDetail,
  type RecordFilters,
} from "@/services/referralService";

const STATUSES = [
  "pending",
  "qualified",
  "reward_pending",
  "rewarded",
  "rejected",
  "expired",
  "reversed",
  "fraud_review",
] as const;

const PAGE_SIZE = 25;

export default function ReferralRecordsPage() {
  const [rows, setRows] = useState<ReferralRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<RecordFilters>({});
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReferralRecordDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(null);
    try {
      const page = await listReferralRecords({ ...filters, limit: PAGE_SIZE, offset });
      setRows(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ReferralsDisabledError) setDisabled(err.message);
      else setError(err instanceof Error ? err.message : "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      setDetail(await getReferralRecord(id));
    } catch {
      setError("Failed to load that referral");
    } finally {
      setDetailLoading(false);
    }
  };

  // Changing a filter must reset paging, or an admin can land on an empty
  // page 3 of a 5-row result and think the filter found nothing.
  const applyFilter = (patch: RecordFilters) => {
    setOffset(0);
    setFilters((f) => ({ ...f, ...patch }));
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Referrals
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Every referral and where it reached in its lifecycle
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
              onChange={(e) => applyFilter({ program_type: e.target.value as RecordFilters["program_type"] })}
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
              onChange={(e) => applyFilter({ status: e.target.value as RecordFilters["status"] })}
              className={filterClass}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilter({ code: codeInput.trim() });
              }}
              className="relative flex-1 min-w-[200px]"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search referral code…"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className={`${filterClass} w-full pl-10`}
              />
            </form>

            {(filters.program_type || filters.status || filters.code) && (
              <button
                onClick={() => {
                  setCodeInput("");
                  setOffset(0);
                  setFilters({});
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState message="No referrals match these filters yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 text-left">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Referral</th>
                    <th className="px-6 py-3">Programme</th>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Rewarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr
                      key={r.referral_id}
                      onClick={() => void openDetail(r.referral_id)}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3 font-semibold text-slate-900">#{r.referral_id}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {PROGRAM_LABELS[r.program_type] ?? r.program_type}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">{r.code}</td>
                      <td className="px-6 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-6 py-3 text-slate-500">{formatDateTime(r.created_at)}</td>
                      <td className="px-6 py-3 text-slate-500">{formatDateTime(r.rewarded_at)}</td>
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
        isOpen={detail !== null || detailLoading}
        onClose={() => setDetail(null)}
        title={detail ? `Referral #${detail.referral.referral_id}` : "Loading…"}
        maxWidth="3xl"
      >
        {detailLoading || !detail ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Detail label="Programme" value={PROGRAM_LABELS[detail.referral.program_type]} />
              <Detail label="Status" value={detail.referral.status.replace(/_/g, " ")} />
              <Detail label="Referrer" value={detail.referral.referrer_entity_id} mono />
              <Detail label="Referred" value={detail.referral.referred_entity_id} mono />
              <Detail label="Code" value={detail.referral.code} mono />
              <Detail label="Qualified" value={formatDateTime(detail.referral.qualified_at)} />
              <Detail
                label="Qualifying event"
                value={detail.referral.qualifying_event_type ?? "—"}
              />
              <Detail label="Evidence" value={detail.referral.qualifying_ref_id ?? "—"} mono />
              {detail.referral.rejected_reason && (
                <Detail label="Rejected because" value={detail.referral.rejected_reason} />
              )}
            </div>

            <Block title="Rewards">
              {detail.rewards.length === 0 ? (
                <p className="text-sm text-slate-400">No reward has been issued yet.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.rewards.map((w) => (
                    <li
                      key={w.reward_id}
                      className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {rewardSummary(w.reward_type, w.amount_millis, w.percent, w.total_uses)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {w.beneficiary_role} · used {w.used_count}/{w.total_uses}
                          {w.posted_ledger ? ` · posted to ${w.posted_ledger}` : ""}
                        </p>
                      </div>
                      <StatusPill status={w.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            <Block title="Lifecycle">
              {detail.events.length === 0 ? (
                <p className="text-sm text-slate-400">No events recorded.</p>
              ) : (
                <ol className="space-y-2">
                  {detail.events.map((ev) => (
                    <li key={ev.event_id} className="flex gap-3 text-sm">
                      <span className="text-slate-400 whitespace-nowrap text-xs pt-0.5">
                        {formatDateTime(ev.created_at)}
                      </span>
                      <span className="font-medium text-slate-700">{ev.event_type}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Block>
          </div>
        )}
      </Modal>
    </div>
  );
}
