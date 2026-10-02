"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
    RiderSupportTicket,
    TicketStatus,
    listRiderSupportTickets,
    updateRiderSupportTicket,
} from "@/services/riderSupportService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const STATUS_LABEL: Record<TicketStatus, string> = {
    open: "Open",
    in_progress: "In progress",
    resolved: "Resolved",
    closed: "Closed",
};

const STATUS_STYLE: Record<TicketStatus, string> = {
    open: "bg-red-100 text-red-800",
    in_progress: "bg-amber-100 text-amber-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-700",
};

/**
 * Rider support queue. Tickets come from the rider app's "Report issue"; safety
 * tickets are highlighted because they need a fast human response.
 */
export default function RiderSupportPage() {
    const { toast, showToast, hideToast } = useToast();
    const [filter, setFilter] = useState<TicketStatus | "">("open");
    const [tickets, setTickets] = useState<RiderSupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listRiderSupportTickets(filter || undefined);
            setTickets(res.tickets ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load tickets");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        load();
    }, [load]);

    const setStatus = async (t: RiderSupportTicket, status: TicketStatus) => {
        setSaving(t.id);
        try {
            const note = notes[t.id];
            await updateRiderSupportTicket(t.id, status, note !== undefined ? note : undefined);
            showToast(`Ticket #${t.id} marked ${STATUS_LABEL[status].toLowerCase()}`, "success");
            await load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Could not update ticket", "error");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-4 p-4 md:p-6">
            <Toast toast={toast} onClose={hideToast} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Rider Support</h1>
                    <p className="text-sm text-gray-500">Issues riders reported from the app. The note you add is shown to the rider.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="rounded border px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as TicketStatus | "")}>
                        <option value="">All tickets</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button onClick={load} className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm">
                        <RefreshCw size={14} /> Reload
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : error ? (
                <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle size={16} /> {error}</div>
            ) : tickets.length === 0 ? (
                <p className="rounded border bg-white p-6 text-sm text-gray-500">No tickets here.</p>
            ) : (
                <ul className="space-y-3">
                    {tickets.map((t) => (
                        <li key={t.id} className={`rounded-lg border bg-white p-4 ${t.category === "safety" && (t.status === "open" || t.status === "in_progress") ? "border-red-400" : ""}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">#{t.id} · {t.subject}</span>
                                        <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                                        <span className={`rounded px-2 py-0.5 text-xs ${t.category === "safety" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>{t.category}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t.rider_name || "Rider"} · {t.rider_phone || "no phone"}
                                        {t.order_id ? ` · order #${t.order_id}` : ""} · {new Date(t.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{t.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <input
                                    className="min-w-[14rem] flex-1 rounded border px-3 py-2 text-sm"
                                    placeholder="Note to the rider (optional)"
                                    maxLength={500}
                                    value={notes[t.id] ?? t.admin_note ?? ""}
                                    onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                                />
                                {(["in_progress", "resolved", "closed"] as TicketStatus[])
                                    .filter((s) => s !== t.status)
                                    .map((s) => (
                                        <button key={s} disabled={saving === t.id} onClick={() => setStatus(t, s)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">
                                            {s === "in_progress" ? "Start" : s === "resolved" ? "Resolve" : "Close"}
                                        </button>
                                    ))}
                                {t.status !== "open" && (
                                    <button disabled={saving === t.id} onClick={() => setStatus(t, "open")} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Reopen</button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
