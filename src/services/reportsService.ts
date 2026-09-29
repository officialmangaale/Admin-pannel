"use client";

// Admin Reports and Exports API client (platform upgrade Module 24).
// Every report is a CSV download from an existing, already-computed backend
// query (restaurant-service or rider-service) — this client only builds the
// filtered URL, attaches auth, and saves the response as a file. No report
// data or math is computed here.

const RESTAURANT_API_BASE_URL =
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL ||
  "https://restaurant-prod.mangaale.com";
const RIDER_API_BASE_URL =
  process.env.NEXT_PUBLIC_RIDER_API_BASE_URL ||
  "https://rider-prod.mangaale.com";

export type ReportServiceBase = "restaurant" | "rider";

export interface ReportDefinition {
  id: string;
  label: string;
  description: string;
  base: ReportServiceBase;
  path: string;
  fields: ReportField[];
}

export type ReportField =
  | "date_range"
  | "restaurant_id"
  | "status"
  | "coupon_id"
  | "rider_id"
  | "dimension"
  | "search"
  | "activity"
  | "program_type"
  | "beneficiary_entity_id";

// One definition per named report in the module spec. Profit-loss,
// commission and delivery-fee are one entry: the backend rollup already
// returns restaurant-commission and delivery-fee columns alongside net
// profit/loss from the same query, so one export covers all three.
export const REPORTS: ReportDefinition[] = [
  {
    id: "orders",
    label: "Orders",
    description: "Every order in the selected date range, across all restaurants.",
    base: "restaurant",
    path: "/admin/reports/orders/export-csv",
    fields: ["date_range", "restaurant_id", "status"],
  },
  {
    id: "profit-loss",
    label: "Profit & Loss / Commission / Delivery Fees",
    description:
      "Revenue, commission, delivery-fee and net profit/loss, grouped by restaurant, rider, day, week, month or location.",
    base: "restaurant",
    path: "/admin/reports/profit-loss/export-csv",
    fields: ["date_range", "restaurant_id", "dimension"],
  },
  {
    id: "coupons",
    label: "Coupon Redemptions",
    description: "Every coupon redemption across all restaurants and coupons.",
    base: "restaurant",
    path: "/admin/reports/coupons/export-csv",
    fields: ["date_range", "restaurant_id", "coupon_id"],
  },
  {
    id: "referrals",
    label: "Referral Rewards",
    description: "Referral rewards posted to the ledger, by programme and status.",
    base: "restaurant",
    path: "/admin/reports/referrals/export-csv",
    fields: ["date_range", "program_type", "status", "beneficiary_entity_id"],
  },
  {
    id: "restaurant-settlements",
    label: "Restaurant Settlements",
    description: "The restaurant payout ledger across every restaurant.",
    base: "restaurant",
    path: "/admin/reports/restaurant-settlements/export-csv",
    fields: ["date_range", "restaurant_id"],
  },
  {
    id: "users",
    label: "Users",
    description: "Per-customer order activity, spend and GMV.",
    base: "restaurant",
    path: "/admin/reports/users/export-csv",
    fields: ["date_range", "search", "activity"],
  },
  {
    id: "rider-wallet",
    label: "Rider Wallet Transactions",
    description: "The net-payable wallet ledger across every rider.",
    base: "rider",
    path: "/admin/reports/riders/wallet-transactions/export-csv",
    fields: ["date_range", "rider_id"],
  },
  {
    id: "rider-settlements",
    label: "Rider Settlements",
    description: "Admin-recorded settlement events across every rider.",
    base: "rider",
    path: "/admin/reports/riders/settlements/export-csv",
    fields: ["date_range", "rider_id"],
  },
];

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

function baseUrlFor(base: ReportServiceBase): string {
  return base === "rider" ? RIDER_API_BASE_URL : RESTAURANT_API_BASE_URL;
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] || fallback;
}

/**
 * Fetches a report as CSV and saves it as a file in the browser. Throws with
 * a readable message if the backend responds with an error (JSON envelope)
 * instead of a CSV body.
 */
export async function downloadReportCSV(
  report: ReportDefinition,
  params: Record<string, string | undefined>
): Promise<void> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  const url = `${baseUrlFor(report.base)}${report.path}${query ? `?${query}` : ""}`;

  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    let message = `Report request failed (${response.status})`;
    try {
      const parsed = JSON.parse(await response.text());
      message = parsed?.message || parsed?.error || message;
    } catch {
      // Response wasn't JSON; keep the generic message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = filenameFromContentDisposition(
    response.headers.get("Content-Disposition"),
    `${report.id}-report.csv`
  );

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
