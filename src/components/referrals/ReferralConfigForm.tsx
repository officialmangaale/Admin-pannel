"use client";

import { useMemo, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  REWARD_TYPES,
  AUTO_PAYABLE_REWARD_TYPES,
  millisToRupees,
  rupeesToMillis,
  rewardSummary,
  type ReferralConfig,
  type ReferralConfigUpdate,
  type RewardType,
  type RestaurantQualifyOn,
} from "@/services/referralService";

// The form edits rupees; the API speaks milli-rupees. Conversion happens only
// at the two boundaries below, never scattered through the component.
interface Draft {
  name: string;
  referrer_reward_type: RewardType;
  referrer_reward_rupees: string;
  referrer_reward_percent: string;
  referrer_reward_uses: string;
  referrer_reward_cap_rupees: string;
  referred_reward_type: RewardType;
  referred_reward_rupees: string;
  referred_reward_percent: string;
  referred_reward_uses: string;
  min_qualifying_order_rupees: string;
  restaurant_qualify_on: RestaurantQualifyOn;
  rider_min_deliveries: string;
  invite_expiry_days: string;
  reward_expiry_days: string;
  max_rewards_per_referrer: string;
  max_rewards_per_referred: string;
  self_referral_block_enabled: boolean;
  duplicate_contact_review_enabled: boolean;
  duplicate_device_review_enabled: boolean;
  allow_test_mode: boolean;
  admin_notes: string;
}

const toDraft = (c: ReferralConfig): Draft => ({
  name: c.name,
  referrer_reward_type: c.referrer_reward_type,
  referrer_reward_rupees: String(millisToRupees(c.referrer_reward_millis)),
  referrer_reward_percent: String(c.referrer_reward_percent),
  referrer_reward_uses: String(c.referrer_reward_uses || 1),
  referrer_reward_cap_rupees: String(millisToRupees(c.referrer_reward_max_discount_millis)),
  referred_reward_type: c.referred_reward_type,
  referred_reward_rupees: String(millisToRupees(c.referred_reward_millis)),
  referred_reward_percent: String(c.referred_reward_percent),
  referred_reward_uses: String(c.referred_reward_uses || 1),
  min_qualifying_order_rupees: String(millisToRupees(c.min_qualifying_order_millis)),
  restaurant_qualify_on: c.restaurant_qualify_on,
  rider_min_deliveries: String(c.rider_min_deliveries),
  invite_expiry_days: String(c.invite_expiry_days),
  reward_expiry_days: String(c.reward_expiry_days),
  max_rewards_per_referrer: String(c.max_rewards_per_referrer),
  max_rewards_per_referred: String(c.max_rewards_per_referred),
  self_referral_block_enabled: c.self_referral_block_enabled,
  duplicate_contact_review_enabled: c.duplicate_contact_review_enabled,
  duplicate_device_review_enabled: c.duplicate_device_review_enabled,
  allow_test_mode: c.allow_test_mode,
  admin_notes: c.admin_notes,
});

const num = (raw: string): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function ReferralConfigForm({
  config,
  saving,
  onSubmit,
  onCancel,
}: {
  config: ReferralConfig;
  saving: boolean;
  onSubmit: (update: ReferralConfigUpdate) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(config));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const isPercent = draft.referrer_reward_type === "percent_discount";
  const isDiscount = isPercent || draft.referrer_reward_type === "flat_discount";

  // The same validation the backend applies, run as the admin types so a
  // rejected save is rare rather than the normal way to discover a rule.
  const problems = useMemo(() => {
    const list: string[] = [];
    const uses = num(draft.referrer_reward_uses);
    const percent = num(draft.referrer_reward_percent);
    const rupees = num(draft.referrer_reward_rupees);

    if (uses < 1) list.push("Reward uses must be at least 1.");
    if (percent > 100) list.push("A percentage reward cannot exceed 100%.");
    if (
      config.is_enabled &&
      draft.referrer_reward_type !== "none" &&
      rupees === 0 &&
      percent === 0
    ) {
      list.push(
        'This programme is live but the referrer reward is zero. Set an amount, or set the reward type to "No reward".'
      );
    }
    return list;
  }, [draft, config.is_enabled]);

  const preview = rewardSummary(
    draft.referrer_reward_type,
    rupeesToMillis(num(draft.referrer_reward_rupees)),
    num(draft.referrer_reward_percent),
    num(draft.referrer_reward_uses)
  );

  const notAutoPayable =
    draft.referrer_reward_type !== "none" &&
    !AUTO_PAYABLE_REWARD_TYPES.includes(draft.referrer_reward_type);

  const uncappedPercent = isPercent && num(draft.referrer_reward_cap_rupees) === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problems.length > 0) return;
    onSubmit({
      program_type: config.program_type,
      name: draft.name,
      referrer_reward_type: draft.referrer_reward_type,
      referrer_reward_millis: rupeesToMillis(num(draft.referrer_reward_rupees)),
      referrer_reward_percent: num(draft.referrer_reward_percent),
      referrer_reward_uses: num(draft.referrer_reward_uses) || 1,
      referrer_reward_max_discount_millis: rupeesToMillis(num(draft.referrer_reward_cap_rupees)),
      referred_reward_type: draft.referred_reward_type,
      referred_reward_millis: rupeesToMillis(num(draft.referred_reward_rupees)),
      referred_reward_percent: num(draft.referred_reward_percent),
      referred_reward_uses: num(draft.referred_reward_uses) || 1,
      min_qualifying_order_millis: rupeesToMillis(num(draft.min_qualifying_order_rupees)),
      restaurant_qualify_on: draft.restaurant_qualify_on,
      rider_min_deliveries: num(draft.rider_min_deliveries),
      invite_expiry_days: num(draft.invite_expiry_days),
      reward_expiry_days: num(draft.reward_expiry_days),
      max_rewards_per_referrer: num(draft.max_rewards_per_referrer),
      max_rewards_per_referred: num(draft.max_rewards_per_referred),
      self_referral_block_enabled: draft.self_referral_block_enabled,
      duplicate_contact_review_enabled: draft.duplicate_contact_review_enabled,
      duplicate_device_review_enabled: draft.duplicate_device_review_enabled,
      allow_test_mode: draft.allow_test_mode,
      admin_notes: draft.admin_notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Saving supersedes rather than overwrites, which is worth stating: an
          admin editing a live rule needs to know past referrals are safe. */}
      <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">
        Saving creates a new version of this rule. Referrals that already qualified keep the terms
        they were earned under and are not recalculated.
      </p>

      <Field label="Display name">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Section title="Referrer reward">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Reward type">
            <select
              value={draft.referrer_reward_type}
              onChange={(e) => set("referrer_reward_type", e.target.value as RewardType)}
              className={inputClass}
            >
              {REWARD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          {isPercent ? (
            <Field label="Percentage off">
              <input
                type="number"
                min={0}
                max={100}
                step="0.001"
                value={draft.referrer_reward_percent}
                onChange={(e) => set("referrer_reward_percent", e.target.value)}
                className={inputClass}
              />
            </Field>
          ) : (
            <Field label="Amount (₹)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.referrer_reward_rupees}
                onChange={(e) => set("referrer_reward_rupees", e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          {isDiscount && (
            <>
              <Field
                label="Number of uses"
                hint="How many orders the discount applies to."
              >
                <input
                  type="number"
                  min={1}
                  value={draft.referrer_reward_uses}
                  onChange={(e) => set("referrer_reward_uses", e.target.value)}
                  className={inputClass}
                />
              </Field>
              {isPercent && (
                <Field label="Maximum discount (₹)" hint="0 means uncapped.">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.referrer_reward_cap_rupees}
                    onChange={(e) => set("referrer_reward_cap_rupees", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
            </>
          )}
        </div>

        <div className="mt-3 bg-slate-900 text-white rounded-xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            Customers will see
          </p>
          <p className="font-bold mt-0.5">{preview || "No reward"}</p>
        </div>

        {uncappedPercent && (
          <Warning>
            This percentage has no ceiling. A 50% discount on a ₹4,000 order costs ₹2,000, once per
            use. Set a maximum discount unless that is intended.
          </Warning>
        )}
        {notAutoPayable && (
          <Warning>
            <strong>{draft.referrer_reward_type}</strong> cannot be paid out automatically. Referrals
            will qualify and appear in the ledger as <em>pending</em> for someone to settle by hand.
          </Warning>
        )}
      </Section>

      <Section title="Referred-entity reward" subtitle="Optional. Leave as “none” to reward only the referrer.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Reward type">
            <select
              value={draft.referred_reward_type}
              onChange={(e) => set("referred_reward_type", e.target.value as RewardType)}
              className={inputClass}
            >
              {REWARD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          {draft.referred_reward_type === "percent_discount" ? (
            <Field label="Percentage off">
              <input
                type="number"
                min={0}
                max={100}
                step="0.001"
                value={draft.referred_reward_percent}
                onChange={(e) => set("referred_reward_percent", e.target.value)}
                className={inputClass}
              />
            </Field>
          ) : (
            <Field label="Amount (₹)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.referred_reward_rupees}
                onChange={(e) => set("referred_reward_rupees", e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </Section>

      <Section title="Qualification">
        {config.program_type === "customer_referral" && (
          <Field
            label="Minimum order value (₹)"
            hint="0 means any delivered first order qualifies."
          >
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.min_qualifying_order_rupees}
              onChange={(e) => set("min_qualifying_order_rupees", e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
        {config.program_type === "restaurant_referral" && (
          <Field label="Qualifies on">
            <select
              value={draft.restaurant_qualify_on}
              onChange={(e) =>
                set("restaurant_qualify_on", e.target.value as RestaurantQualifyOn)
              }
              className={inputClass}
            >
              <option value="admin_activation">Admin activation</option>
              {/* The backend understands these milestones, but nothing in
                  restaurant-service currently marks a restaurant invoice as
                  paid, so selecting one would produce a programme that never
                  pays. They stay listed — and selectable if already set — so
                  the choice reappears the moment an invoice-payment flow
                  exists, without a migration or a config change. */}
              <option
                value="first_paid_invoice"
                disabled={draft.restaurant_qualify_on !== "first_paid_invoice"}
              >
                First paid invoice — not available yet
              </option>
              <option
                value="first_billing_cycle"
                disabled={draft.restaurant_qualify_on !== "first_billing_cycle"}
              >
                First billing cycle — not available yet
              </option>
            </select>
            <p className="text-xs text-slate-500 mt-1.5">
              Invoice-based milestones need an invoice payment flow that does not exist yet.
              Restaurant referrals qualify on activation.
            </p>
          </Field>
        )}
        {config.program_type === "rider_referral" && (
          <Field label="Completed deliveries required">
            <input
              type="number"
              min={1}
              value={draft.rider_min_deliveries}
              onChange={(e) => set("rider_min_deliveries", e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
      </Section>

      <Section title="Limits and expiry">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Invite expiry (days)" hint="0 means never.">
            <input type="number" min={0} value={draft.invite_expiry_days}
              onChange={(e) => set("invite_expiry_days", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Reward expiry (days)" hint="0 means never.">
            <input type="number" min={0} value={draft.reward_expiry_days}
              onChange={(e) => set("reward_expiry_days", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Max rewards per referrer" hint="0 means unlimited.">
            <input type="number" min={0} value={draft.max_rewards_per_referrer}
              onChange={(e) => set("max_rewards_per_referrer", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Max rewards per referred" hint="0 means unlimited.">
            <input type="number" min={0} value={draft.max_rewards_per_referred}
              onChange={(e) => set("max_rewards_per_referred", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Fraud controls">
        <div className="space-y-2">
          <Check label="Block self-referral" checked={draft.self_referral_block_enabled}
            onChange={(v) => set("self_referral_block_enabled", v)} />
          <Check label="Hold duplicate phone/email for review"
            checked={draft.duplicate_contact_review_enabled}
            onChange={(v) => set("duplicate_contact_review_enabled", v)} />
          <Check label="Hold duplicate device for review"
            checked={draft.duplicate_device_review_enabled}
            onChange={(v) => set("duplicate_device_review_enabled", v)} />
          <Check label="Allow test accounts to qualify" checked={draft.allow_test_mode}
            onChange={(v) => set("allow_test_mode", v)} />
        </div>
        {draft.allow_test_mode && (
          <Warning>Test accounts will earn real rewards. Leave this off in production.</Warning>
        )}
      </Section>

      <Field label="Admin notes">
        <textarea
          rows={2}
          value={draft.admin_notes}
          onChange={(e) => set("admin_notes", e.target.value)}
          className={inputClass}
        />
      </Field>

      {problems.length > 0 && (
        <div className="bg-red-50/70 border border-red-200/70 rounded-xl p-4 space-y-1">
          {problems.map((p) => (
            <p key={p} className="text-sm text-red-800">
              {p}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || problems.length > 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold disabled:opacity-50"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          Save rule
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none text-sm";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-xs text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 pt-5">
      <p className="font-bold text-slate-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mb-3">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-amber-500/30"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex gap-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
      <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
      <p className="text-xs text-amber-900 leading-relaxed">{children}</p>
    </div>
  );
}
