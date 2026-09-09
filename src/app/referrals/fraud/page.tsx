"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import StatusPill from "@/components/referrals/StatusPill";
import { Notice, EmptyState, Pager, filterClass } from "@/components/referrals/Shared";
import {
  listFraudReviews,
  resolveFraudReview,
  formatDateTime,
  PROGRAM_LABELS,
  ReferralsDisabledError,
  type FraudReview,
} from "@/services/referralService";

const PAGE_SIZE = 25;

/** Plain-language explanation of why a referral was held, so a reviewer does
 *  not have to know the reason codes. */
const REASONS: Record<string, string> = {
  self_referral: "The referrer and the referred account share contact details.",
  duplicate_contact: "This phone or email has been used on an earlier referral.",
  duplicate_device: "This device has been used on an earlier referral.",
  duplicate_ip: "This IP address has been used on an earlier referral.",
  velocity: "An unusual number of referrals in a short period.",
  manual: "Flagged manually.",
};

export default function FraudQueuePage() {
  const [rows, setRows] = useState<FraudReview[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<"open" | "approved" | "rejected">("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<string | null>(null);

  const [deciding, setDeciding] = useState<{
    review: FraudReview;
    decision: "approved" | "rejected";
  } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(null);
    try {
      const page = await listFraudReviews(status, PAGE_SIZE, offset);
      setRows(page.items);
      setTotal(page.total);
    } catch (err) {
      if (err instanceof ReferralsDisabledError) setDisabled(err.message);
      else setError(err instanceof Error ? err.message : "Failed to load the review queue");
    } finally {
      setLoading(false);
    }
  }, [status, offset]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const submit = async () => {
    if (!deciding) return;
    setSubmitting(true);
    try {
      await resolveFraudReview(deciding.review.review_id, deciding.decision, note.trim());
      showToast(
        deciding.decision === "approved"
          ? "Referral released — it will be rewarded by the next qualifying event"
          : "Referral rejected",
        "success"
      );
      setDeciding(null);
      setNote("");
      await fetchRows();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to resolve", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <Toast toast={toast} onClose={hideToast} />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Review Queue
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Referrals held back from automatic reward until someone checks them
        </p>
      </div>

      <ReferralTabs />

      {disabled && <Notice tone="amber" text={disabled} />}
      {error && <Notice tone="red" text={error} />}

      {!disabled && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
            <select
              value={status}
              onChange={(e) => {
                setOffset(0);
                setStatus(e.target.value as typeof status);
              }}
              className={filterClass}
            >
              <option value="open">Awaiting review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              message={
                status === "open"
                  ? "Nothing is waiting for review."
                  : `No ${status} reviews.`
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((review) => (
                <li key={review.review_id} className="p-5 sm:p-6 flex flex-wrap gap-4 items-start">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900">
                        Referral #{review.referral_id}
                      </span>
                      <StatusPill status={review.status} />
                      <span className="text-xs text-slate-400">
                        {PROGRAM_LABELS[review.program_type] ?? review.program_type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1.5">
                      {REASONS[review.reason_code] ?? review.reason_code}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Flagged {formatDateTime(review.created_at)}
                      {review.resolved_at && ` · resolved ${formatDateTime(review.resolved_at)}`}
                    </p>
                    {review.resolution_note && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        “{review.resolution_note}”
                      </p>
                    )}
                  </div>

                  {review.status === "open" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDeciding({ review, decision: "approved" });
                          setNote("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        <ShieldCheck size={15} /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setDeciding({ review, decision: "rejected" });
                          setNote("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <ShieldX size={15} /> Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Pager total={total} offset={offset} pageSize={PAGE_SIZE} onChange={setOffset} />
        </div>
      )}

      <Modal
        isOpen={deciding !== null}
        onClose={() => (submitting ? undefined : setDeciding(null))}
        title={deciding?.decision === "approved" ? "Approve referral" : "Reject referral"}
      >
        {deciding && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {deciding.decision === "approved" ? (
                <>
                  Referral #{deciding.review.referral_id} returns to <strong>pending</strong>. It is
                  not paid on the spot — the next qualifying event rewards it through the normal
                  rules.
                </>
              ) : (
                <>
                  Referral #{deciding.review.referral_id} is closed permanently and will never be
                  rewarded.
                </>
              )}
            </p>

            <label className="block">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Note (recorded in the audit log)
              </span>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you check?"
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setDeciding(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-semibold disabled:opacity-50 ${
                  deciding.decision === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {deciding.decision === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
