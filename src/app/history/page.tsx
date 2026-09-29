"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { AuditLogEntry, listAuditLogs } from "@/services/auditLogService";

const dateStr = (v: string) => new Date(v).toLocaleString();

/**
 * Admin Audit Log (platform upgrade Module 17). Replaces a previous version
 * of this page ("Audit Trail") that rendered five hardcoded sample log
 * entries with no backing API and a fabricated retention-policy claim.
 *
 * This is a generic, middleware-written log of every admin-mutating
 * request (POST/PUT/PATCH/DELETE under /admin) across the platform — not a
 * hand-instrumented per-feature log. Referral admin actions also appear in
 * their own richer audit trail (Referrals > Audit, with explicit
 * before/after entity snapshots); this page complements that with complete,
 * automatic coverage across every other admin feature.
 */
export default function HistoryPage() {
    const [adminId, setAdminId] = useState("");
    const [route, setRoute] = useState("");
    const [page, setPage] = useState(1);

    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);

    const limit = 25;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listAuditLogs({
                adminId: adminId.trim() || undefined,
                route: route.trim() || undefined,
                page,
                limit,
            });
            setEntries(res.items);
            setTotal(res.meta.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load the audit log");
        } finally {
            setLoading(false);
        }
    }, [adminId, route, page]);

    useEffect(() => {
        void load();
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Admin Audit Log</h1>
                    <p className="text-sm text-gray-500">
                        Every admin-mutating request across the platform, logged automatically.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="rounded-lg border p-4 grid gap-3 md:grid-cols-2">
                <input
                    className="rounded-md border px-3 py-2 text-sm"
                    placeholder="Filter by admin ID"
                    value={adminId}
                    onChange={(e) => {
                        setAdminId(e.target.value);
                        setPage(1);
                    }}
                />
                <input
                    className="rounded-md border px-3 py-2 text-sm"
                    placeholder="Filter by route (exact, e.g. /admin/commission-rules/:id)"
                    value={route}
                    onChange={(e) => {
                        setRoute(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
            ) : entries.length === 0 ? (
                <p className="text-sm text-gray-500">No admin actions match this filter.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2" />
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Admin</th>
                                <th className="px-3 py-2">Method</th>
                                <th className="px-3 py-2">Route</th>
                                <th className="px-3 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e) => (
                                <AuditRow
                                    key={e.id}
                                    entry={e}
                                    expanded={expanded === e.id}
                                    onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function AuditRow({
    entry,
    expanded,
    onToggle,
}: {
    entry: AuditLogEntry;
    expanded: boolean;
    onToggle: () => void;
}) {
    const methodColor =
        entry.method === "DELETE"
            ? "bg-red-50 text-red-700"
            : entry.method === "POST"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-700";

    return (
        <>
            <tr className="border-t cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <td className="px-3 py-2">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{dateStr(entry.created_at)}</td>
                <td className="px-3 py-2 font-mono text-xs">{entry.admin_id || "—"}</td>
                <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${methodColor}`}>
                        {entry.method}
                    </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{entry.route}</td>
                <td className="px-3 py-2">
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                    >
                        {entry.status_code}
                    </span>
                </td>
            </tr>
            {expanded && (
                <tr className="border-t bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <JsonBlock title="Path params" value={entry.path_params} />
                            <JsonBlock title="Request body (sensitive fields redacted)" value={entry.request_body} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-1">{title}</p>
            <pre className="bg-gray-900 text-gray-100 rounded-md p-3 text-[11px] leading-relaxed overflow-x-auto max-h-64">
                {value ? JSON.stringify(value, null, 2) : "—"}
            </pre>
        </div>
    );
}
