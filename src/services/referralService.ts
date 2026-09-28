"use client";

// Referral management API client.
//
// Follows the same shape as posAppAssetsService: bearer token from
// localStorage, the platform's `{status, message, data}` envelope unwrapped to
// `data`, and errors surfaced as thrown Errors carrying the backend's message.
//
// Every endpoint here is behind ADMIN_REFERRAL_MANAGEMENT_ENABLED on the
// backend. When that flag is off the API answers 403 with
// "referral management is disabled"; the UI shows that message rather than
// pretending the screens are broken.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";

// ─── Domain types (mirror internal/referralcore/models.go) ──────────────────

export type ProgramType =
  | "customer_referral"
  | "restaurant_referral"
  | "rider_referral";

export const PROGRAM_TYPES: ProgramType[] = [
  "customer_referral",
  "restaurant_referral",
  "rider_referral",
];

export const PROGRAM_LABELS: Record<ProgramType, string> = {
  customer_referral: "Customer refers customer",
  restaurant_referral: "Restaurant refers restaurant",
  rider_referral: "Rider refers rider",
};

export type RewardType =
  | "none"
  | "wallet_credit"
  | "flat_discount"
  | "percent_discount"
  | "billing_credit"
  | "subscription_discount"
  | "rider_bonus"
  | "coupon"
  | "points"
  | "manual";

/** Reward types the backend can pay out automatically. Anything else stays
 *  `pending` for an admin to settle by hand, which the form warns about. */
export const AUTO_PAYABLE_REWARD_TYPES: RewardType[] = [
  "wallet_credit",
  "billing_credit",
  "rider_bonus",
  "percent_discount",
  "flat_discount",
];

export const REWARD_TYPES: RewardType[] = [
  "none",
  "wallet_credit",
  "flat_discount",
  "percent_discount",
  "billing_credit",
  "subscription_discount",
  "rider_bonus",
  "coupon",
  "points",
  "manual",
];

export type RestaurantQualifyOn =
  | "admin_activation"
  | "first_paid_invoice"
  | "first_billing_cycle";

export type ReferralStatus =
  | "pending"
  | "qualified"
  | "reward_pending"
  | "rewarded"
  | "rejected"
  | "expired"
  | "reversed"
  | "fraud_review";

export type RewardStatus =
  | "pending"
  | "available"
  | "used"
  | "expired"
  | "reversed"
  | "cancelled";

export interface ReferralConfig {
  config_id: number;
  program_type: ProgramType;
  name: string;
  is_enabled: boolean;

  referrer_reward_type: RewardType;
  referrer_reward_millis: number;
  referrer_reward_percent: number;
  referrer_reward_uses: number;
  referrer_reward_max_discount_millis: number;

  referred_reward_type: RewardType;
  referred_reward_millis: number;
  referred_reward_percent: number;
  referred_reward_uses: number;
  referred_reward_max_discount_millis: number;

  min_qualifying_order_millis: number;
  customer_first_delivered_only: boolean;
  restaurant_qualify_on: RestaurantQualifyOn;
  rider_min_deliveries: number;

  invite_expiry_days: number;
  reward_expiry_days: number;
  max_rewards_per_referrer: number;
  max_rewards_per_referred: number;

  self_referral_block_enabled: boolean;
  duplicate_contact_review_enabled: boolean;
  duplicate_device_review_enabled: boolean;
  allow_test_mode: boolean;

  effective_from: string;
  effective_to?: string | null;
  admin_notes: string;
  created_by_admin_id?: string | null;
  updated_by_admin_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type ReferralConfigUpdate = Partial<
  Omit<
    ReferralConfig,
    | "config_id"
    | "created_at"
    | "updated_at"
    | "created_by_admin_id"
    | "updated_by_admin_id"
  >
> & { program_type: ProgramType };

export interface ReferralRecord {
  referral_id: number;
  program_type: ProgramType;
  config_id?: number | null;
  referrer_entity_id: string;
  referred_entity_id: string;
  code: string;
  status: ReferralStatus;
  qualifying_event_type?: string | null;
  qualifying_ref_id?: string | null;
  qualified_at?: string | null;
  rewarded_at?: string | null;
  rejected_reason?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralReward {
  reward_id: number;
  referral_id: number;
  program_type: ProgramType;
  beneficiary_entity_id: string;
  beneficiary_role: "referrer" | "referred";
  reward_type: RewardType;
  amount_millis: number;
  percent: number;
  max_discount_millis: number;
  total_uses: number;
  used_count: number;
  manual_label?: string;
  status: RewardStatus;
  posted_ledger?: string | null;
  posted_ref_id?: string | null;
  expires_at?: string | null;
  reversed_reason?: string | null;
  reversal_of_reward_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface FraudReview {
  review_id: number;
  referral_id: number;
  program_type: ProgramType;
  reason_code: string;
  details?: Record<string, unknown>;
  status: "open" | "approved" | "rejected";
  resolved_by_admin_id?: string | null;
  resolution_note: string;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  audit_id: number;
  admin_id: string;
  action: string;
  entity_kind: string;
  entity_id: string;
  before_value?: unknown;
  after_value?: unknown;
  reason: string;
  correlation_id: string;
  created_at: string;
}

export interface Paged<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

// ─── Transport ───────────────────────────────────────────────────────────────

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

/** Thrown when the backend feature flag is off, so screens can show the real
 *  reason instead of a generic failure. */
export class ReferralsDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferralsDisabledError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${RESTAURANT_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      parsed?.message ||
      `Request failed (${response.status})`;
    // 403 from this surface means the feature flag is off, not that the admin
    // lacks permission — the routes already sit behind the same permission
    // gate as the rest of /admin.
    if (response.status === 403) throw new ReferralsDisabledError(message);
    throw new Error(message);
  }
  return (parsed?.data ?? parsed) as T;
}

const qs = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
};

// ─── Configs ─────────────────────────────────────────────────────────────────

export const listReferralConfigs = (includeHistory = false) =>
  request<ReferralConfig[]>(
    `/admin/referrals/configs${includeHistory ? "?include_history=true" : ""}`
  );

export const getReferralConfig = (program: ProgramType) =>
  request<ReferralConfig>(`/admin/referrals/configs/${program}`);

/** Saves a rule. The backend supersedes the open row rather than mutating it,
 *  so referrals already earned keep the terms they were judged by. */
export const saveReferralConfig = (update: ReferralConfigUpdate) =>
  request<ReferralConfig>(`/admin/referrals/configs/${update.program_type}`, {
    method: "PUT",
    body: JSON.stringify(update),
  });

export const setReferralConfigEnabled = (
  program: ProgramType,
  enabled: boolean
) =>
  request<ReferralConfig>(`/admin/referrals/configs/${program}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });

// ─── Records ─────────────────────────────────────────────────────────────────

export interface RecordFilters {
  program_type?: ProgramType | "";
  status?: ReferralStatus | "";
  referrer_entity_id?: string;
  referred_entity_id?: string;
  code?: string;
  limit?: number;
  offset?: number;
}

export const listReferralRecords = async (
  filters: RecordFilters = {}
): Promise<Paged<ReferralRecord>> => {
  const data = await request<{
    records: ReferralRecord[];
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/referrals/records${qs(filters as Record<string, string | number>)}`);
  return {
    items: data.records ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? 50,
    offset: data.offset ?? 0,
  };
};

export interface ReferralRecordDetail {
  referral: ReferralRecord;
  events: Array<{
    event_id: number;
    event_type: string;
    correlation_id: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
  rewards: ReferralReward[];
}

export const getReferralRecord = (id: number) =>
  request<ReferralRecordDetail>(`/admin/referrals/records/${id}`);

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface RewardFilters {
  program_type?: ProgramType | "";
  status?: RewardStatus | "";
  beneficiary_entity_id?: string;
  limit?: number;
  offset?: number;
}

export const listReferralRewards = async (
  filters: RewardFilters = {}
): Promise<Paged<ReferralReward>> => {
  const data = await request<{
    rewards: ReferralReward[];
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/referrals/rewards${qs(filters as Record<string, string | number>)}`);
  return {
    items: data.rewards ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? 50,
    offset: data.offset ?? 0,
  };
};

/** Writes a compensating ledger entry. It does NOT claw value back out of the
 *  destination ledger — the API response says so, and the UI repeats it. */
export const reverseReferralReward = (id: number, reason: string) =>
  request<ReferralReward>(`/admin/referrals/rewards/${id}/reverse`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

// ─── Fraud reviews ───────────────────────────────────────────────────────────

export const listFraudReviews = async (
  status: "open" | "approved" | "rejected" = "open",
  limit = 50,
  offset = 0
): Promise<Paged<FraudReview>> => {
  const data = await request<{
    reviews: FraudReview[];
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/referrals/fraud-reviews${qs({ status, limit, offset })}`);
  return {
    items: data.reviews ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? 50,
    offset: data.offset ?? 0,
  };
};

export const resolveFraudReview = (
  id: number,
  decision: "approved" | "rejected",
  note: string
) =>
  request<FraudReview>(`/admin/referrals/fraud-reviews/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  });

// ─── Audit ───────────────────────────────────────────────────────────────────

export const listReferralAudit = async (
  entityKind = "",
  entityId = "",
  limit = 50,
  offset = 0
): Promise<Paged<AuditEntry>> => {
  const data = await request<{
    entries: AuditEntry[];
    total: number;
    limit: number;
    offset: number;
  }>(
    `/admin/referrals/audit${qs({
      entity_kind: entityKind,
      entity_id: entityId,
      limit,
      offset,
    })}`
  );
  return {
    items: data.entries ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? 50,
    offset: data.offset ?? 0,
  };
};

// ─── Display helpers ─────────────────────────────────────────────────────────

/** Money is milli-rupees end to end (see migration 088). The UI is the only
 *  place it becomes rupees, and never the other way around by hand. */
export const millisToRupees = (millis: number): number => millis / 1000;
export const rupeesToMillis = (rupees: number): number => Math.round(rupees * 1000);

export const formatRupees = (millis: number): string =>
  `₹${millisToRupees(millis).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

/** Mirrors referralcore.RewardSummary so the panel describes an offer exactly
 *  as the apps do. */
export const rewardSummary = (
  rewardType: RewardType,
  millis: number,
  percent: number,
  uses: number
): string => {
  const n = uses < 1 ? 1 : uses;
  const orders = n > 1 ? "orders" : "order";
  switch (rewardType) {
    case "percent_discount":
      if (percent <= 0) return "—";
      return n > 1
        ? `${percent}% off next ${n} ${orders}`
        : `${percent}% off next ${orders}`;
    case "flat_discount":
      if (millis <= 0) return "—";
      return n > 1
        ? `${formatRupees(millis)} off next ${n} ${orders}`
        : `${formatRupees(millis)} off next ${orders}`;
    case "wallet_credit":
      return millis > 0 ? `${formatRupees(millis)} wallet credit` : "—";
    case "billing_credit":
      return millis > 0 ? `${formatRupees(millis)} billing credit` : "—";
    case "rider_bonus":
      return millis > 0 ? `${formatRupees(millis)} bonus` : "—";
    case "none":
      return "No reward";
    default:
      return millis > 0 ? `${formatRupees(millis)} reward` : "—";
  }
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
