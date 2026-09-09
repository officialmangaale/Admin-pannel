"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import { Notice, EmptyState, Pager, filterClass } from "@/components/referrals/Shared";
import {
  listReferralAudit,
  formatDateTime,
  ReferralsDisabledError,
  type AuditEntry,
} from "@/services/referralService";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  "config.upsert": "Edited a rule",
  "config.enable": "Enabled a programme",
  "config.disable": "Paused a programme",
  "reward.reverse": "Reversed a reward",
  "fraud.approved": "Approved a held referral",
  "fraud.rejected": "Rejected a held referral",
};

export default function ReferralAuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [entityKind, setEntityKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(null);
    try {
      const page = await listReferralAudit(entityKind, "", PAGE_SIZE, offset);
      setRows(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ReferralsDisabledError) setDisabled(err.message);
      else setError(err instanceof Error ? err.message : "Failed to load the audit log");
    } finally {
      setLoading(false);
    }
  }, [entityKind, offset]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Audit Log
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Who changed what, when, and what the values were before and after
        </p>
      </div>

      <ReferralTabs />

      {disabled && <Notice tone="amber" text={disabled} />}
      {error && <Notice tone="red" text={error} />}

      {!disabled && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
            <select
              value={entityKind}
              onChange={(e) => {
                setOffset(0);
                setEntityKind(e.target.value);
              }}
              className={filterClass}
            >
              <option value="">All changes</option>
              <option value="config">Rule changes</option>
              <option value="reward">Reward reversals</option>
              <option value="fraud_review">Review decisions</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState message="No changes have been recorded yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((entry) => {
                const open = expanded === entry.audit_id;
                return (
                  <li key={entry.audit_id}>
                    <button
                      onClick={() => setExpanded(open ? null : entry.audit_id)}
                      className="w-full text-left px-5 sm:px-6 py-4 flex items-start gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <span className="text-slate-400 mt-0.5">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                          <span className="font-normal text-slate-500"> — {entry.entity_id}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDateTime(entry.created_at)} · admin{" "}
                          <span className="font-mono">{entry.admin_id}</span>
                          {entry.correlation_id && ` · ${entry.correlation_id}`}
                        </p>
                        {entry.reason && (
                          <p className="text-xs text-slate-600 mt-1 italic">“{entry.reason}”</p>
                        )}
                      </div>
                    </button>

                    {open && (
                      <div className="px-5 sm:px-6 pb-5 grid md:grid-cols-2 gap-4">
                        <JsonBlock title="Before" value={entry.before_value} />
                        <JsonBlock title="After" value={entry.after_value} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Pager total={total} offset={offset} pageSize={PAGE_SIZE} onChange={setOffset} />
        </div>
      )}
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{title}</p>
      <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-[11px] leading-relaxed overflow-x-auto max-h-64">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
