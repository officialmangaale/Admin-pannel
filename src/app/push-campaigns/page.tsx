"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, Send, Users } from "lucide-react";
import {
    PushAudienceType,
    PushCampaign,
    PushCampaignInput,
    PushCampaignStats,
    PushItemType,
    createPushCampaign,
    getPushCampaign,
    listPushCampaigns,
    previewPushAudience,
} from "@/services/pushCampaignService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const TITLE_MAX = 65;
const BODY_MAX = 240;

const statusStyle: Record<string, string> = {
    sending: "bg-amber-100 text-amber-800",
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
};

/**
 * Promotional push campaigns: "Get Maggi for Rs10 with free delivery" ->
 * selected customers get a notification that opens that product in the app,
 * where the current backend price/offer loads. Orders placed after the tap are
 * attributed to the campaign.
 */
export default function PushCampaignsPage() {
    const { toast, showToast, hideToast } = useToast();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [itemType, setItemType] = useState<PushItemType>("grocery");
    const [productId, setProductId] = useState("");
    const [audience, setAudience] = useState<PushAudienceType>("user_ids");
    const [userIdsText, setUserIdsText] = useState("");
    const [confirmAll, setConfirmAll] = useState(false);

    const [audienceSize, setAudienceSize] = useState<number | null>(null);
    const [busy, setBusy] = useState<"preview" | "send" | null>(null);

    const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<PushCampaignStats | null>(null);

    const buildInput = (): PushCampaignInput | null => {
        const pid = Number(productId.trim());
        if (!Number.isInteger(pid) || pid <= 0) {
            showToast("Enter a valid numeric product ID", "error");
            return null;
        }
        const input: PushCampaignInput = {
            title: title.trim(),
            body: body.trim(),
            item_type: itemType,
            product_id: pid,
            audience_type: audience,
        };
        if (audience === "user_ids") {
            input.user_ids = userIdsText.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
        } else {
            input.confirm_all_customers = confirmAll;
        }
        return input;
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listPushCampaigns();
            setCampaigns(res.campaigns ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load campaigns");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // While a campaign is sending, refresh its numbers every 3 seconds.
    useEffect(() => {
        if (!selected || selected.status !== "sending") return;
        const id = setInterval(async () => {
            try {
                const fresh = await getPushCampaign(selected.id);
                setSelected(fresh);
                if (fresh.status !== "sending") load();
            } catch {
                // Keep the last known numbers; the next tick retries.
            }
        }, 3000);
        return () => clearInterval(id);
    }, [selected, load]);

    const preview = async () => {
        const input = buildInput();
        if (!input) return;
        setBusy("preview");
        try {
            const res = await previewPushAudience(input);
            setAudienceSize(res.audience_size);
        } catch (e) {
            setAudienceSize(null);
            showToast(e instanceof Error ? e.message : "Preview failed", "error");
        } finally {
            setBusy(null);
        }
    };

    const send = async () => {
        const input = buildInput();
        if (!input) return;
        const who = audience === "all_customers" ? "ALL customers with notifications on" : `${input.user_ids?.length ?? 0} selected customers`;
        if (!window.confirm(`Send "${input.title}" to ${who}? This cannot be undone.`)) return;
        setBusy("send");
        try {
            const created = await createPushCampaign(input);
            showToast("Campaign started", "success");
            setSelected({ ...created, attributed_orders: 0, attributed_revenue: 0 });
            setConfirmAll(false);
            load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Could not start campaign", "error");
        } finally {
            setBusy(null);
        }
    };

    const open = async (id: number) => {
        try {
            setSelected(await getPushCampaign(id));
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Could not load campaign", "error");
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <Toast toast={toast} onClose={hideToast} />
            <div>
                <h1 className="text-2xl font-semibold">Push Campaigns</h1>
                <p className="text-sm text-gray-500">
                    Send a product notification. Tapping it opens the product with today&apos;s price; orders placed after the tap are attributed to the campaign.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="space-y-3 rounded-lg border bg-white p-4">
                    <h2 className="font-medium">New campaign</h2>
                    <label className="block text-sm">
                        Title <span className="text-gray-400">({title.length}/{TITLE_MAX})</span>
                        <input className="mt-1 w-full rounded border px-3 py-2" maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Get Maggi for ₹10" />
                    </label>
                    <label className="block text-sm">
                        Message <span className="text-gray-400">({body.length}/{BODY_MAX})</span>
                        <textarea className="mt-1 w-full rounded border px-3 py-2" rows={3} maxLength={BODY_MAX} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Free delivery today only. Tap to order." />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm">
                            Product type
                            <select className="mt-1 w-full rounded border px-3 py-2" value={itemType} onChange={(e) => setItemType(e.target.value as PushItemType)}>
                                <option value="grocery">Grocery product</option>
                                <option value="food">Restaurant food item</option>
                            </select>
                        </label>
                        <label className="block text-sm">
                            Product ID
                            <input className="mt-1 w-full rounded border px-3 py-2" inputMode="numeric" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="e.g. 345" />
                        </label>
                    </div>
                    <label className="block text-sm">
                        Audience
                        <select className="mt-1 w-full rounded border px-3 py-2" value={audience} onChange={(e) => { setAudience(e.target.value as PushAudienceType); setAudienceSize(null); }}>
                            <option value="user_ids">Specific customers (test / targeted)</option>
                            <option value="all_customers">All customers</option>
                        </select>
                    </label>
                    {audience === "user_ids" ? (
                        <label className="block text-sm">
                            Customer user IDs (comma or line separated)
                            <textarea className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" rows={3} value={userIdsText} onChange={(e) => setUserIdsText(e.target.value)} />
                        </label>
                    ) : (
                        <label className="flex items-start gap-2 rounded bg-amber-50 p-3 text-sm text-amber-900">
                            <input type="checkbox" className="mt-1" checked={confirmAll} onChange={(e) => setConfirmAll(e.target.checked)} />
                            I understand this sends to every customer who has notifications enabled. Send a test to yourself first.
                        </label>
                    )}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button onClick={preview} disabled={busy !== null} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-50">
                            {busy === "preview" ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />} Check audience
                        </button>
                        <button onClick={send} disabled={busy !== null || (audience === "all_customers" && !confirmAll)} className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                            {busy === "send" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
                        </button>
                        {audienceSize !== null && <span className="text-sm text-gray-600">{audienceSize} eligible customer(s)</span>}
                    </div>
                </section>

                <section className="space-y-3 rounded-lg border bg-white p-4">
                    <h2 className="font-medium">Campaign results</h2>
                    {!selected ? (
                        <p className="text-sm text-gray-500">Select a campaign to see delivery and order numbers.</p>
                    ) : (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{selected.title}</span>
                                <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[selected.status]}`}>{selected.status}</span>
                                {selected.status === "sending" && <Loader2 size={14} className="animate-spin" />}
                            </div>
                            <p className="text-gray-600">{selected.body}</p>
                            <dl className="grid grid-cols-2 gap-2 pt-2">
                                <div className="rounded bg-gray-50 p-2"><dt className="text-gray-500">Customers reached</dt><dd className="text-lg font-semibold">{selected.sent_count}</dd></div>
                                <div className="rounded bg-gray-50 p-2"><dt className="text-gray-500">Skipped (no device / already sent)</dt><dd className="text-lg font-semibold">{selected.skipped_count}</dd></div>
                                <div className="rounded bg-gray-50 p-2"><dt className="text-gray-500">Orders attributed</dt><dd className="text-lg font-semibold">{selected.attributed_orders}</dd></div>
                                <div className="rounded bg-gray-50 p-2"><dt className="text-gray-500">Attributed revenue</dt><dd className="text-lg font-semibold">₹{selected.attributed_revenue.toFixed(2)}</dd></div>
                            </dl>
                            {selected.last_error && <p className="text-red-600">Error: {selected.last_error}</p>}
                            <button onClick={() => open(selected.id)} className="inline-flex items-center gap-1 text-blue-600"><RefreshCw size={14} /> Refresh</button>
                        </div>
                    )}
                </section>
            </div>

            <section className="rounded-lg border bg-white">
                <div className="flex items-center justify-between border-b p-3">
                    <h2 className="font-medium">Recent campaigns</h2>
                    <button onClick={load} className="inline-flex items-center gap-1 text-sm text-blue-600"><RefreshCw size={14} /> Reload</button>
                </div>
                {loading ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Loading…</div>
                ) : error ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-red-600"><AlertCircle size={16} /> {error}</div>
                ) : campaigns.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No campaigns yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr><th className="p-3">Title</th><th className="p-3">Product</th><th className="p-3">Audience</th><th className="p-3">Status</th><th className="p-3">Reached</th><th className="p-3">Sent at</th></tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => (
                                    <tr key={c.id} className="cursor-pointer border-t hover:bg-gray-50" onClick={() => open(c.id)}>
                                        <td className="p-3">{c.title}</td>
                                        <td className="p-3">{c.item_type} #{c.product_id}</td>
                                        <td className="p-3">{c.audience_type === "all_customers" ? "All customers" : "Selected"}</td>
                                        <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs ${statusStyle[c.status]}`}>{c.status}</span></td>
                                        <td className="p-3">{c.sent_count}/{c.recipients_total}</td>
                                        <td className="p-3">{new Date(c.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
