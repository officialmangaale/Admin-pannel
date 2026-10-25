"use client";

import Link from "next/link";
import { useState } from "react";
import DispatchConfiguration from "./DispatchConfiguration";
import ConsignmentConfiguration from "./ConsignmentConfiguration";
import { CommercePolicy, getCommercePolicy, getGroceryFinances, GroceryFinances, GroceryPreview, MerchantType, previewGrocery, recordGroceryPayout, saveCommercePolicy } from "@/services/commerceService";

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
const message = (err: unknown) => err instanceof Error ? err.message : "Request failed";

export default function CommercePage() {
  const [kind, setKind] = useState<MerchantType>("grocery");
  const [id, setId] = useState("");
  const [policy, setPolicy] = useState<CommercePolicy | null>(null);
  const [finances, setFinances] = useState<GroceryFinances | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<GroceryPreview | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [fee, setFee] = useState(0);
  const [vendorCost, setVendorCost] = useState(0);
  const [platformRider, setPlatformRider] = useState(true);
  const [cash, setCash] = useState(true);
  const [payout, setPayout] = useState(0);
  const [reference, setReference] = useState("");
  const field = "rounded border px-3 py-2 w-full";

  const load = async () => {
    const merchantId = Number(id);
    if (!Number.isSafeInteger(merchantId) || merchantId <= 0) { setNotice("Enter a valid merchant ID"); return; }
    setBusy(true); setNotice(""); setPolicy(null); setFinances(null); setPreview(null);
    try { setPolicy(await getCommercePolicy(kind, merchantId)); }
    catch (err) { setNotice(message(err)); }
    finally { setBusy(false); }
  };
  const update = (patch: Partial<CommercePolicy>) => { if (policy) setPolicy({ ...policy, ...patch }); setPreview(null); };

  return <div className="p-6 space-y-6 max-w-6xl">
    <h1 className="text-2xl font-semibold">Commerce and settlement</h1>
    <p>Set each merchant&apos;s delivery earnings. Changes apply to new orders. Existing order amounts stay fixed.</p>
    <DispatchConfiguration />
    <form onSubmit={e => { e.preventDefault(); void load(); }} className="flex gap-3 items-end">
      <label>Business<select className={field} value={kind} onChange={e => setKind(e.target.value as MerchantType)}><option value="grocery">Grocery / shopkeeper</option><option value="restaurant">Restaurant</option></select></label>
      <label>Merchant ID<input className={field} type="number" min="1" step="1" value={id} onChange={e => setId(e.target.value)} required /></label>
      <button className="border rounded px-4 py-2" disabled={busy}>Load merchant</button>
    </form>
    {notice && <p role="status" className="bg-amber-50 border rounded p-3">{notice}</p>}
    {policy && <>
      <form className="border rounded p-4 space-y-4" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setNotice("");
        try { setPolicy(await saveCommercePolicy(policy)); setNotice("Saved. Past order snapshots are unchanged."); }
        catch (err) { setNotice(message(err)); } finally { setBusy(false); }
      }}>
        <h2 className="font-semibold">{policy.merchant_type} #{policy.merchant_id} · revision {policy.version}</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <label>Business model<select className={field} value={policy.business_model} onChange={e => update({ business_model: e.target.value as CommercePolicy["business_model"] })}><option value="vendor">Vendor operated</option><option value="owned_store">Our own store</option></select></label>
          {policy.merchant_type === "grocery" && <>
            <label>Commission (%)<input className={field} type="number" min="0" max="100" step="0.1" required value={policy.commission_permille / 10} onChange={e => update({ commission_permille: Math.round(Number(e.target.value) * 10) })} /></label>
            <label>Fixed commission (₹)<input className={field} type="number" min="0" max="1000000" step="0.01" required value={policy.commission_fixed_cents / 100} onChange={e => update({ commission_fixed_cents: Math.round(Number(e.target.value) * 100) })} /></label>
          </>}
          <label>Platform rider pay per delivery (₹)<input className={field} type="number" min="0" max="1000000" step="0.01" required value={policy.rider_pay_cents / 100} onChange={e => update({ rider_pay_cents: Math.round(Number(e.target.value) * 100) })} /></label>
        </div>
        {policy.merchant_type === "restaurant" ? <p>Restaurant commission is configured in <Link className="underline" href="/commission-rules">Commission Rules</Link>. Dine-in and pickup receive no delivery payout.</p> : <p>Commission applies to item revenue after merchant-funded discounts and is capped at that revenue. A shop using its own rider keeps the delivery fee and handles that rider&apos;s pay. Our stores deduct the frozen vendor supply cost before calculating store earnings.</p>}
        <label className="flex gap-2"><input type="checkbox" checked={policy.enabled} onChange={e => update({ enabled: e.target.checked })} />Accept new delivery orders with these rules</label>
        <p>Turning this off after saving pauses new delivery orders. Existing orders keep their frozen terms and can finish.</p>
        <button className="border rounded px-4 py-2" disabled={busy}>Save policy</button>
      </form>
      {policy.merchant_type === "grocery" && <>
        {policy.business_model === "owned_store" && <ConsignmentConfiguration key={policy.merchant_id} merchantId={policy.merchant_id} />}
        <form className="border rounded p-4 space-y-3" onSubmit={async e => {
          e.preventDefault(); setBusy(true);
          try { setPreview(await previewGrocery(policy, subtotal, discount, fee, platformRider, cash, policy.business_model === "owned_store" ? vendorCost : 0)); }
          catch (err) { setNotice(message(err)); } finally { setBusy(false); }
        }}>
          <h2 className="font-semibold">Preview the entered rates</h2>
          <div className="grid md:grid-cols-3 gap-4">{[["Item subtotal (₹)", subtotal, setSubtotal], ["Discount (₹)", discount, setDiscount], ["Delivery fee (₹)", fee, setFee]].map(([label, value, setter]) => <label key={String(label)}>{String(label)}<input className={field} type="number" min="0" max="1000000" step="0.01" required value={(value as number) / 100} onChange={e => (setter as (v: number) => void)(Math.round(Number(e.target.value) * 100))} /></label>)}</div>
          <label className="flex gap-2"><input type="checkbox" checked={platformRider} onChange={e => setPlatformRider(e.target.checked)} />Platform rider</label>
          {policy.business_model === "owned_store" && <label className="block">Total agreed vendor supply cost (₹)<input className={field} type="number" min="0" max={subtotal / 100} step="0.01" required value={vendorCost / 100} onChange={e => setVendorCost(Math.round(Number(e.target.value) * 100))} /></label>}
          <label className="flex gap-2"><input type="checkbox" checked={cash} onChange={e => setCash(e.target.checked)} />Cash on delivery</label>
          <button className="border rounded px-4 py-2" disabled={busy}>Calculate</button>
          {preview && <dl className="grid md:grid-cols-3 gap-3">{Object.entries(preview).map(([name, amount]) => <div key={name}><dt>{name.replaceAll("_", " ").replace(" cents", "")}</dt><dd className="font-semibold">{money(amount)}</dd></div>)}</dl>}
        </form>
        <section className="border rounded p-4 space-y-4">
          <h2 className="font-semibold">Merchant payable and recorded transfers</h2>
          <button className="border rounded px-4 py-2" disabled={busy} onClick={async () => {
            setBusy(true); try { setFinances(await getGroceryFinances(policy.merchant_id)); } catch (err) { setNotice(message(err)); } finally { setBusy(false); }
          }}>Load settlement ledger</button>
          {finances && <>
            <p className="font-semibold">Balance: {money(finances.balance_cents)}</p><p>Positive: platform owes the merchant. Negative: merchant owes the platform. Latest 100 entries are shown; balance includes all entries.</p>
            <form className="flex flex-wrap gap-3 items-end" onSubmit={async e => {
              e.preventDefault(); setBusy(true); setNotice("");
              try { await recordGroceryPayout(policy.merchant_id, payout, reference.trim(), finances.balance_cents < 0 ? "from_merchant" : "to_merchant"); setFinances(await getGroceryFinances(policy.merchant_id)); setPayout(0); setReference(""); setNotice("Completed bank transfer recorded."); }
              catch (err) { setNotice(message(err)); } finally { setBusy(false); }
            }}>
              <label>{finances.balance_cents < 0 ? "Received from merchant (₹)" : "Transferred to merchant (₹)"}<input className={field} type="number" min="0.01" max={Math.abs(finances.balance_cents) / 100} step="0.01" required value={payout / 100} onChange={e => setPayout(Math.round(Number(e.target.value) * 100))} /></label>
              <label>Bank reference<input className={field} minLength={3} maxLength={120} required value={reference} onChange={e => setReference(e.target.value)} /></label>
              <button className="border rounded px-4 py-2" disabled={busy || finances.balance_cents === 0}>Record completed transfer</button>
            </form>
            <p>This records an existing transfer. Use the same reference when retrying.</p>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{["Order / reference", "Type", "Merchant earned", "Vendor supply cost", "Cash held by merchant", "Platform revenue", "Rider cost", "Balance change"].map(h => <th className="text-left p-2" key={h}>{h}</th>)}</tr></thead><tbody>{finances.entries.map(entry => <tr key={entry.id} className="border-t"><td className="p-2">{entry.order_id ? `#${entry.order_id}` : entry.reference}</td><td>{entry.entry_type}</td>{[entry.merchant_earning_cents, entry.vendor_cost_cents, entry.merchant_cash_cents, entry.platform_revenue_cents, entry.rider_cost_cents, entry.amount_cents].map((amount, i) => <td key={i}>{amount === null ? "—" : money(amount)}</td>)}</tr>)}</tbody></table></div>
          </>}
        </section>
      </>}
    </>}
  </div>;
}
