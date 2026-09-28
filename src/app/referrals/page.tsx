"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Gift,
  Loader2,
  AlertCircle,
  Edit2,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import ReferralTabs from "@/components/referrals/ReferralTabs";
import ReferralConfigForm from "@/components/referrals/ReferralConfigForm";
import {
  listReferralConfigs,
  saveReferralConfig,
  setReferralConfigEnabled,
  rewardSummary,
  formatDateTime,
  PROGRAM_LABELS,
  ReferralsDisabledError,
  type ReferralConfig,
  type ReferralConfigUpdate,
} from "@/services/referralService";

export default function ReferralProgramsPage() {
  const [configs, setConfigs] = useState<ReferralConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReferralConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { toast, showToast, hideToast } = useToast();

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisabled(null);
    try {
      const rows = await listReferralConfigs(false);
      setConfigs(rows);
    } catch (err) {
      // A disabled feature flag is a configuration state, not a failure, so it
      // gets its own explanation rather than a red error box.
      if (err instanceof ReferralsDisabledError) setDisabled(err.message);
      else setError(err instanceof Error ? err.message : "Failed to load referral programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async (update: ReferralConfigUpdate) => {
    setSaving(true);
    try {
      await saveReferralConfig(update);
      showToast("Referral rule saved", "success");
      setEditing(null);
      await fetchConfigs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save rule", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (config: ReferralConfig) => {
    setTogglingId(config.config_id);
    try {
      await setReferralConfigEnabled(config.program_type, !config.is_enabled);
      showToast(
        !config.is_enabled
          ? `${PROGRAM_LABELS[config.program_type]} is now live`
          : `${PROGRAM_LABELS[config.program_type]} is paused`,
        "success"
      );
      await fetchConfigs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const enabledCount = configs.filter((c) => c.is_enabled).length;

  return (
    <div className="space-y-8 pb-10">
      <Toast toast={toast} onClose={hideToast} />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Referral Management
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Configure how customers, restaurants and riders are rewarded for referrals
        </p>
      </div>

      <ReferralTabs />

      {/* Each programme also needs its server-side feature flag on. Saying so
          here saves an admin from enabling a rule and wondering why nothing
          happens. */}
      <div className="flex gap-3 items-start bg-blue-50/70 border border-blue-200/70 rounded-2xl p-4">
        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-900">
          A programme pays out only when <strong>both</strong> the rule below is enabled{" "}
          <strong>and</strong> its server flag is set
          (<code className="text-xs bg-blue-100 px-1 py-0.5 rounded">CUSTOMER_REFERRAL_ENABLED</code>,{" "}
          <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">RESTAURANT_REFERRAL_ENABLED</code>,{" "}
          <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">RIDER_REFERRAL_ENABLED</code>), plus{" "}
          <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">REFERRAL_AUTO_REWARD_ENABLED</code> for
          rewards to be credited automatically.
        </p>
      </div>

      {disabled && (
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 flex gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-amber-900">Referral management is switched off</p>
            <p className="text-sm text-amber-800 mt-1">
              {disabled} Set{" "}
              <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">
                ADMIN_REFERRAL_MANAGEMENT_ENABLED=true
              </code>{" "}
              on restaurant-service to use these screens.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50/70 border border-red-200/70 rounded-2xl p-5 flex gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        !disabled && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { label: "Programmes", value: configs.length, icon: Gift, color: "text-indigo-500", bg: "bg-indigo-50/80" },
                { label: "Live", value: enabledCount, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50/80" },
                { label: "Paused", value: configs.length - enabledCount, icon: XCircle, color: "text-slate-400", bg: "bg-slate-50/80" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0 border border-white max-sm:hidden`}
                  >
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {configs.map((config) => (
                <div
                  key={config.config_id}
                  className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col"
                >
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {config.name || PROGRAM_LABELS[config.program_type]}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {config.program_type}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                        config.is_enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {config.is_enabled ? "Live" : "Paused"}
                    </span>
                  </div>

                  <dl className="p-5 space-y-3 text-sm flex-1">
                    <Row
                      label="Referrer gets"
                      value={rewardSummary(
                        config.referrer_reward_type,
                        config.referrer_reward_millis,
                        config.referrer_reward_percent,
                        config.referrer_reward_uses
                      )}
                      strong
                    />
                    <Row
                      label="Referred gets"
                      value={rewardSummary(
                        config.referred_reward_type,
                        config.referred_reward_millis,
                        config.referred_reward_percent,
                        config.referred_reward_uses
                      )}
                    />
                    <Row label="Qualifies on" value={qualificationLabel(config)} />
                    {config.referrer_reward_type === "percent_discount" && (
                      <Row
                        label="Discount cap"
                        value={
                          config.referrer_reward_max_discount_millis > 0
                            ? `₹${config.referrer_reward_max_discount_millis / 1000}`
                            : "Uncapped"
                        }
                        // An uncapped percentage is an open-ended liability.
                        warn={config.referrer_reward_max_discount_millis === 0}
                      />
                    )}
                    <Row
                      label="Invite expiry"
                      value={config.invite_expiry_days > 0 ? `${config.invite_expiry_days} days` : "Never"}
                    />
                    <Row label="Updated" value={formatDateTime(config.updated_at)} />
                  </dl>

                  <div className="p-5 pt-0 flex gap-2">
                    <button
                      onClick={() => setEditing(config)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold"
                    >
                      <Edit2 size={15} /> Edit rule
                    </button>
                    <button
                      onClick={() => void handleToggle(config)}
                      disabled={togglingId === config.config_id}
                      className={`px-4 py-2.5 rounded-xl transition-colors text-sm font-semibold disabled:opacity-50 ${
                        config.is_enabled
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-emerald-500 text-white hover:bg-emerald-600"
                      }`}
                    >
                      {togglingId === config.config_id ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : config.is_enabled ? (
                        "Pause"
                      ) : (
                        "Go live"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => (saving ? undefined : setEditing(null))}
        title={editing ? `Edit — ${PROGRAM_LABELS[editing.program_type]}` : "Edit rule"}
        maxWidth="3xl"
      >
        {editing && (
          <ReferralConfigForm
            config={editing}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSubmit={handleSave}
          />
        )}
      </Modal>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
  warn = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</dt>
      <dd
        className={`text-right ${strong ? "font-bold text-slate-900" : "text-slate-700"} ${
          warn ? "text-amber-600 font-semibold" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function qualificationLabel(config: ReferralConfig): string {
  switch (config.program_type) {
    case "customer_referral":
      return config.min_qualifying_order_millis > 0
        ? `First delivered order over ₹${config.min_qualifying_order_millis / 1000}`
        : "First delivered order";
    case "restaurant_referral":
      return {
        admin_activation: "Admin activation",
        first_paid_invoice: "First paid invoice",
        first_billing_cycle: "First billing cycle",
      }[config.restaurant_qualify_on];
    case "rider_referral":
      return `${config.rider_min_deliveries} completed ${
        config.rider_min_deliveries === 1 ? "delivery" : "deliveries"
      }`;
    default:
      return "—";
  }
}
