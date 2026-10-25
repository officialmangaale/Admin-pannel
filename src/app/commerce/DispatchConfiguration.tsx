"use client";
import { useState } from "react";
import { DispatchConfig, getDispatchConfig, saveDispatchConfig } from "@/services/commerceService";

export default function DispatchConfiguration() {
  const [config, setConfig] = useState<DispatchConfig | null>(null);
  const [ids, setIds] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  return <section className="border rounded p-4 space-y-3">
    <h2 className="font-semibold">Restaurant online delivery rollout</h2>
    <p>Offer customer delivery orders to platform riders when the restaurant starts preparing. Select pilot restaurants before enabling. Disabling stops new offers and acceptance; assigned riders can finish deliveries.</p>
    <button className="border rounded px-4 py-2" disabled={busy} onClick={async () => {
      setBusy(true); setNotice("");
      try { const result = await getDispatchConfig(); setConfig(result); setIds(result.restaurant_ids.join(", ")); }
      catch (err) { setNotice(err instanceof Error ? err.message : "Could not load dispatch settings"); }
      finally { setBusy(false); }
    }}>Load rollout settings</button>
    {notice && <p role="status">{notice}</p>}
    {config && <form className="space-y-3" onSubmit={async e => {
      e.preventDefault();
      const restaurantIds = ids.trim() ? ids.split(",").map(v => Number(v.trim())) : [];
      if (restaurantIds.some(v => !Number.isSafeInteger(v) || v <= 0) || new Set(restaurantIds).size !== restaurantIds.length || (config.enabled && restaurantIds.length === 0)) { setNotice("Enter unique positive pilot restaurant IDs, separated by commas."); return; }
      setBusy(true); setNotice("");
      try { setConfig(await saveDispatchConfig({ ...config, restaurant_ids: restaurantIds })); setNotice("Rollout settings saved."); }
      catch (err) { setNotice(err instanceof Error ? err.message : "Could not save dispatch settings"); }
      finally { setBusy(false); }
    }}>
      <label className="block">Pilot restaurant IDs<input className="block border rounded p-2 w-full" value={ids} onChange={e => setIds(e.target.value)} placeholder="12, 34" /></label>
      <div className="flex flex-wrap gap-4">
        <label>Maximum GPS age (seconds)<input className="block border rounded p-2" type="number" min="30" max="3600" required value={config.location_max_age_seconds} onChange={e => setConfig({ ...config, location_max_age_seconds: Number(e.target.value) })} /></label>
        <label>Maximum search age (seconds)<input className="block border rounded p-2" type="number" min="60" max="86400" required value={config.search_max_age_seconds} onChange={e => setConfig({ ...config, search_max_age_seconds: Number(e.target.value) })} /></label>
      </div>
      <label className="flex gap-2"><input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />Enable online restaurant dispatch</label>
      <button className="border rounded px-4 py-2" disabled={busy}>Save rollout settings</button>
    </form>}
  </section>;
}
