"use client";
import { useState } from "react";
import { ConsignmentOptions, ConsignmentSource, ConsignmentSourceRow, ConsignmentVendor, getConsignmentOptions, listConsignmentSources, listConsignmentVendors, recordConsignmentPayout, saveConsignmentSource } from "@/services/commerceService";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value / 100);
export default function ConsignmentConfiguration({ merchantId }: { merchantId: number }) {
  const empty = (): ConsignmentSource => ({ store_merchant_id: merchantId, fulfillment_store_id: 0, grocery_product_id: 0, vendor_merchant_id: 0, unit_cost_cents: 0, enabled: true, version: 0 });
  const [source, setSource] = useState<ConsignmentSource>(empty);
  const [sources, setSources] = useState<ConsignmentSourceRow[]>([]);
  const [vendors, setVendors] = useState<ConsignmentVendor[]>([]);
  const [vendorId, setVendorId] = useState(0);
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<ConsignmentOptions>({ stores: [], products: [], vendors: [] });
  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const field = "block rounded border px-3 py-2 w-full";
  const balance = vendors.find(v => v.vendor_merchant_id === vendorId)?.balance_cents ?? 0;
  return <section className="border rounded p-4 space-y-4">
    <h2 className="font-semibold">Vendor-owned stock in our store</h2>
    <p>Link each stocked product and fulfillment location to its vendor and agreed supply cost per selling unit. The order freezes this cost. Delivery creates the vendor payable and deducts it from the store&apos;s earnings. The platform records separate transfers to the vendor and the store.</p>
    <p>Use one vendor per product at each location. Finish active orders and empty remaining stock before changing its owner. Configure the source before making a product available to customers.</p>
    <div className="flex gap-3">
      <button className="border rounded p-2" disabled={busy} onClick={async () => { setBusy(true); setNotice(""); try { const [rows, choices] = await Promise.all([listConsignmentSources(merchantId, productSearch), getConsignmentOptions(merchantId, vendorSearch, productSearch)]); setSources(rows); setOptions(choices); } catch (err) { setNotice(err instanceof Error ? err.message : "Could not load sources"); } finally { setBusy(false); } }}>Load stock sources and choices</button>
      <button className="border rounded p-2" disabled={busy} onClick={async () => { setBusy(true); setNotice(""); try { setVendors(await listConsignmentVendors(merchantId)); } catch (err) { setNotice(err instanceof Error ? err.message : "Could not load vendor balances"); } finally { setBusy(false); } }}>Load vendor balances</button>
    </div>
    {notice && <p role="status" className="bg-amber-50 p-3">{notice}</p>}
    <label className="block">Find vendor<input className={field} value={vendorSearch} maxLength={80} onChange={e => setVendorSearch(e.target.value)} placeholder="Vendor name" /></label>
    <label className="block">Find product<input className={field} value={productSearch} maxLength={80} onChange={e => setProductSearch(e.target.value)} placeholder="Store product name" /></label>
    <button type="button" className="border rounded p-2" disabled={busy} onClick={async () => { setBusy(true); try { const [choices, rows] = await Promise.all([getConsignmentOptions(merchantId, vendorSearch, productSearch), listConsignmentSources(merchantId, productSearch)]); setOptions(choices); setSources(rows); } catch (err) { setNotice(err instanceof Error ? err.message : "Could not find vendors or products"); } finally { setBusy(false); } }}>Search choices</button>
    <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setNotice("");
      try { await saveConsignmentSource(source); setSources(await listConsignmentSources(merchantId, productSearch)); setSource(empty()); setNotice("Supply terms saved. Existing order costs stay fixed."); }
      catch (err) { setNotice(err instanceof Error ? err.message : "Could not save source"); }
      finally { setBusy(false); }
    }}>
      <div className="grid md:grid-cols-4 gap-4">
        <label>Fulfillment location<select className={field} required value={source.fulfillment_store_id || ""} disabled={source.version > 0} onChange={e => setSource({ ...source, fulfillment_store_id: Number(e.target.value), grocery_product_id: 0 })}><option value="" disabled>Select location</option>{options.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
        <label>Store product<select className={field} required value={source.grocery_product_id || ""} disabled={source.version > 0} onChange={e => setSource({ ...source, grocery_product_id: Number(e.target.value) })}><option value="" disabled>Select product</option>{options.products.filter(product => product.store_ids.includes(source.fulfillment_store_id)).map(product => <option key={product.id} value={product.id}>{product.name} · {money(product.price_cents)}</option>)}</select></label>
        <label>Vendor<select className={field} required value={source.vendor_merchant_id || ""} onChange={e => setSource({ ...source, vendor_merchant_id: Number(e.target.value) })}><option value="" disabled>Select vendor</option>{source.vendor_merchant_id > 0 && !options.vendors.some(v => v.id === source.vendor_merchant_id) && <option value={source.vendor_merchant_id}>Current vendor #{source.vendor_merchant_id}</option>}{options.vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name} · {vendor.status}</option>)}</select></label>
        <label>Supply cost per unit (₹)<input className={field} type="number" min="0" max="1000000" step="0.01" required value={source.unit_cost_cents / 100} onChange={e => setSource({ ...source, unit_cost_cents: Math.round(Number(e.target.value) * 100) })} /></label>
      </div>
      <label className="flex gap-2"><input type="checkbox" checked={source.enabled} onChange={e => setSource({ ...source, enabled: e.target.checked })} />Active supply terms</label>
      <button className="border rounded p-2" disabled={busy}>Save supply terms</button>{" "}<button type="button" className="border rounded p-2" onClick={() => setSource(empty())}>New source</button>
    </form>
    {sources.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{["Location", "Product", "Vendor", "Unit cost", "Status", ""].map((label, i) => <th key={i} className="text-left p-2">{label}</th>)}</tr></thead><tbody>{sources.map(row => <tr key={row.source.id} className="border-t"><td>{row.store_name} #{row.source.fulfillment_store_id}</td><td>{row.product_name} #{row.source.grocery_product_id}</td><td>{row.vendor_name} #{row.source.vendor_merchant_id}</td><td>{money(row.source.unit_cost_cents)}</td><td>{row.source.enabled ? "Active" : "Disabled"}</td><td><button className="underline p-2" onClick={() => setSource(row.source)}>Edit revision {row.source.version}</button></td></tr>)}</tbody></table><p>Up to 500 sources shown.</p></div>}
    {vendors.length > 0 && <>
      <h3 className="font-semibold">Record a completed vendor transfer</h3>
      <form className="grid md:grid-cols-4 gap-3 items-end" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setNotice("");
        try { await recordConsignmentPayout(merchantId, vendorId, amount, reference); setVendors(await listConsignmentVendors(merchantId)); setAmount(0); setReference(""); setNotice("Vendor transfer recorded. The vendor can see it in their shopkeeper app."); }
        catch (err) { setNotice(err instanceof Error ? err.message : "Could not record vendor transfer"); }
        finally { setBusy(false); }
      }}>
        <label>Vendor and amount due<select className={field} value={vendorId || ""} required onChange={e => setVendorId(Number(e.target.value))}><option value="" disabled>Select vendor</option>{vendors.map(vendor => <option key={vendor.vendor_merchant_id} value={vendor.vendor_merchant_id}>{vendor.vendor_name} #{vendor.vendor_merchant_id} · {money(vendor.balance_cents)}</option>)}</select></label>
        <label>Already transferred (₹)<input className={field} type="number" min="0.01" max={balance / 100} step="0.01" required value={amount / 100} onChange={e => setAmount(Math.round(Number(e.target.value) * 100))} /></label>
        <label>Bank reference<input className={field} minLength={3} maxLength={120} required value={reference} onChange={e => setReference(e.target.value)} /></label>
        <button className="border rounded p-2" disabled={busy || balance <= 0}>Record completed transfer</button>
      </form>
    </>}
  </section>;
}
