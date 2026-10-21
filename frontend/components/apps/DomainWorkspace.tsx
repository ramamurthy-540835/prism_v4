"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

type App = "textile-exports" | "property-auctions" | "stock-exchange";
type Field = { key: string; label: string; type?: "number" | "date" | "textarea" | "select"; required?: boolean; options?: string[] };
type Kind = { key: string; label: string; fields: Field[] };
type RecordItem = { id: string; kind: string; status: string; title: string; ownerId: string; mine: boolean; payload: Record<string, any>; createdAt: string };
const today = () => new Date().toISOString().slice(0, 10);
const kinds: Record<App, Kind[]> = {
  "textile-exports": [{ key: "shipment", label: "Export case", fields: [
    { key: "product", label: "Product / textile", required: true }, { key: "hsCode", label: "HS code" },
    { key: "origin", label: "Country of origin", required: true },
    { key: "destination", label: "Destination market", type: "select", options: ["UAE", "Bangladesh", "Sri Lanka", "United States", "Other"], required: true },
    { key: "buyer", label: "Buyer" }, { key: "route", label: "Proposed route", type: "textarea" },
    { key: "invoiceValue", label: "Invoice value", type: "number" }, { key: "currency", label: "Currency" },
    { key: "documentNotes", label: "Invoice, packing list, IEC, origin and shipping documents", type: "textarea" },
    { key: "customsAdvice", label: "Customs or trade adviser findings", type: "textarea" },
  ] }, { key: "route-option", label: "Route option", fields: [
    { key: "shipmentId", label: "Export case", type: "select", required: true },
    { key: "market", label: "Destination market", type: "select", options: ["UAE", "Bangladesh", "Sri Lanka", "United States", "Other"], required: true },
    { key: "goodsValue", label: "Goods value", type: "number", required: true },
    { key: "freight", label: "Freight estimate", type: "number" },
    { key: "otherCosts", label: "Other costs", type: "number" },
    { key: "dutyRate", label: "Adviser-supplied duty estimate (%)", type: "number" },
    { key: "transitDays", label: "Transit days", type: "number" },
    { key: "provider", label: "Carrier or source" }, { key: "notes", label: "Assumptions and advice", type: "textarea" },
  ] }],
  "property-auctions": [
    { key: "listing", label: "Property listing", fields: [
      { key: "address", label: "Property address", required: true }, { key: "seller", label: "Seller / authority holder", required: true },
      { key: "description", label: "Description", type: "textarea" }, { key: "valuation", label: "Valuation (INR)", type: "number", required: true },
      { key: "reservePrice", label: "Reserve price (INR)", type: "number", required: true },
      { key: "closesOn", label: "Auction closing date", type: "date", required: true },
      { key: "authorityNotes", label: "Seller authority evidence / review", type: "textarea" },
      { key: "titleNotes", label: "Title, encumbrance and valuation notes", type: "textarea" },
    ] },
    { key: "bidder", label: "Bidder verification request", fields: [{ key: "note", label: "Verification note (do not enter identity document numbers)", type: "textarea" }] },
    { key: "bid", label: "Simulated bid", fields: [
      { key: "listingId", label: "Open listing", type: "select", required: true }, { key: "bidAmount", label: "Bid amount (INR)", type: "number", required: true },
    ] },
  ],
  "stock-exchange": [
    { key: "instrument", label: "Watchlist symbol", fields: [
      { key: "exchange", label: "Exchange", type: "select", options: ["NSE", "BSE", "NASDAQ", "NYSE", "OTHER"], required: true },
      { key: "symbol", label: "Ticker symbol", required: true }, { key: "referencePrice", label: "Manual reference price", type: "number", required: true },
      { key: "priceAsOf", label: "Price date", type: "date", required: true }, { key: "note", label: "Notes", type: "textarea" },
    ] },
    { key: "paper-order", label: "Paper trade", fields: [
      { key: "exchange", label: "Exchange", type: "select", required: true }, { key: "symbol", label: "Watchlist symbol", type: "select", required: true },
      { key: "side", label: "Side", type: "select", options: ["buy", "sell"], required: true },
      { key: "quantity", label: "Shares", type: "number", required: true }, { key: "price", label: "Simulated execution price", type: "number", required: true },
      { key: "note", label: "Notes", type: "textarea" },
    ] },
  ],
};
const config: Record<App, { title: string; intro: string; note: string }> = {
  "textile-exports": { title: "Textile Exports", intro: "Track export opportunities, routes, documents and adviser review for each shipment.", note: "Routing through another country does not change origin by itself. Confirm classification, origin and duties with qualified customs advisers before shipping." },
  "property-auctions": { title: "Property Auctions", intro: "Create listings, review seller authority, verify bidders and run simulated bids.", note: "Bids are simulations. This app does not collect deposits, hold funds, transfer title or run a legally binding auction. Commission and deposit figures discussed earlier are not active terms." },
  "stock-exchange": { title: "Stock Exchange", intro: "Build a watchlist and track a paper portfolio using prices you enter.", note: "Prices are entered manually and may be stale. Orders are simulations; no broker, exchange feed or real-money execution is connected." },
};

export default function DomainWorkspace({ app }: { app: App }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [role, setRole] = useState("");
  const [kind, setKind] = useState(kinds[app][0].key);
  const [values, setValues] = useState<Record<string, string>>({ origin: "India", destination: "UAE", currency: "USD", exchange: "NSE", side: "buy", priceAsOf: today() });
  const [editing, setEditing] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const load = useCallback(async () => {
    const response = await fetch(`/api/prism/apps/${app}`, { cache: "no-store" });
    if (response.status === 401) { setSignedIn(false); return; }
    const result = await response.json();
    if (response.ok) setRecords(Array.isArray(result) ? result : []);
    else setMessage(result.error || "Could not load records");
  }, [app]);
  useEffect(() => { load(); fetch("/api/prism/auth").then((response) => response.json()).then((result) => setRole(result.user?.role || "")); }, [load]);
  const active = kinds[app].find((item) => item.key === kind) || kinds[app][0];
  const watchlist = records.filter((item) => item.kind === "instrument");
  const shipments = records.filter((item) => item.kind === "shipment" && item.mine);
  const openListings = records.filter((item) => item.kind === "listing" && item.status === "open" && item.payload.closesOn >= today());
  const fieldOptions = (field: Field) => field.key === "shipmentId" ? shipments.map((item) => ({ value: item.id, label: item.title })) :
    field.key === "listingId" ? openListings.map((item) => ({ value: item.id, label: `${item.title} · reserve ₹${Number(item.payload.reservePrice).toLocaleString("en-IN")}` })) :
    field.key === "symbol" && kind === "paper-order" ? watchlist.filter((item) => item.payload.exchange === values.exchange).map((item) => ({ value: item.payload.symbol, label: item.payload.symbol })) :
    field.key === "exchange" && kind === "paper-order" ? [...new Set(watchlist.map((item) => item.payload.exchange))].map((value) => ({ value, label: value })) :
    (field.options || []).map((value) => ({ value, label: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch(`/api/prism/apps/${app}`, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, payload: values } : { kind, payload: values }) });
    const result = await response.json();
    setMessage(response.ok ? `${active.label} saved.` : result.error || "Could not save record");
    if (response.ok) { setEditing(""); setValues({ origin: "India", destination: "UAE", currency: "USD", exchange: "NSE", side: "buy", priceAsOf: today() }); await load(); }
    setBusy(false);
  };
  const setStatus = async (id: string, status: string) => {
    setBusy(true);
    const response = await fetch(`/api/prism/apps/${app}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const result = await response.json(); setMessage(response.ok ? `Status changed to ${status}.` : result.error || "Could not change status");
    if (response.ok) await load(); setBusy(false);
  };
  const actions = (item: RecordItem) => {
    if (item.kind === "shipment") return item.mine && item.status === "draft" ? [["Submit for review", "review"]] : role === "admin" && item.status === "review" ? [["Approve", "approved"], ["Request changes", "changes_requested"]] : item.mine && item.status === "changes_requested" ? [["Return to draft", "draft"]] : [];
    if (item.kind === "listing") return item.mine && item.status === "draft" ? [["Submit seller review", "review"]] : role === "admin" && item.status === "review" ? [["Open auction", "open"], ["Request changes", "changes_requested"]] : item.mine && item.status === "changes_requested" ? [["Return to draft", "draft"]] : (item.mine || role === "admin") && item.status === "open" ? [["Close auction", "closed"]] : [];
    if (item.kind === "bidder" && role === "admin" && item.status === "pending") return [["Verify bidder", "verified"], ["Reject", "rejected"]];
    return [];
  };
  const visible = records.filter((item) => `${item.title} ${item.kind} ${item.status}`.toLowerCase().includes(filter.toLowerCase()));
  const holdings = useMemo(() => {
    const map = new Map<string, { exchange: string; symbol: string; shares: number; cost: number }>();
    records.filter((item) => item.kind === "paper-order").forEach((item) => { const { exchange, symbol, side, quantity, price } = item.payload;
      const key = `${exchange}:${symbol}`; const current = map.get(key) || { exchange, symbol, shares: 0, cost: 0 };
      current.shares += (side === "buy" ? 1 : -1) * Number(quantity); current.cost += (side === "buy" ? 1 : -1) * Number(quantity) * Number(price); map.set(key, current); });
    return [...map.values()].map((item) => {
      const reference = watchlist.find((row) => row.payload.exchange === item.exchange && row.payload.symbol === item.symbol);
      const marketValue = item.shares * Number(reference?.payload.referencePrice || 0);
      return { ...item, marketValue, paperPnl: marketValue - item.cost, priceAsOf: reference?.payload.priceAsOf || "" };
    }).filter((item) => item.shares > 0);
  }, [records]);
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar /><main className="min-w-0 flex-1 space-y-5 bg-[#f8faff] p-6">
    <header><h1 className="text-2xl font-semibold">{config[app].title}</h1><p className="mt-2 text-sm text-[#525252]">{config[app].intro}</p></header>
    <div className="ibm-panel max-w-5xl border-l-4 border-amber-500 p-4 text-sm">{config[app].note}</div>
    {!signedIn ? <div className="ibm-panel p-5">Sign in to save and view this workspace. <Link href="/login" className="text-blue-700 underline">Open sign in</Link></div> : <>
      <section className="grid gap-5 xl:grid-cols-[minmax(300px,420px)_1fr]">
        <form onSubmit={submit} className="ibm-panel grid content-start gap-3 p-5"><h2 className="font-semibold">{editing ? `Edit ${active.label.toLowerCase()}` : "Create a record"}</h2>
          <label className="text-sm">Record type<select className="mt-1 block w-full rounded border p-2" value={kind} disabled={!!editing} onChange={(event) => { setKind(event.target.value); setValues({ origin: "India", destination: "UAE", currency: "USD", exchange: "NSE", side: "buy", priceAsOf: today() }); }}>{kinds[app].map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          {active.fields.map((field) => <label key={field.key} className="text-sm">{field.label}{field.type === "textarea" ? <textarea className="mt-1 block min-h-20 w-full rounded border p-2" value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} /> : field.type === "select" ? <select required={field.required} className="mt-1 block w-full rounded border p-2" value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value, ...(field.key === "exchange" && kind === "paper-order" ? { symbol: "" } : {}) })}><option value="">Select</option>{fieldOptions(field).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={field.required} className="mt-1 block w-full rounded border p-2" type={field.type || "text"} min={field.type === "number" ? "0.01" : field.type === "date" && field.key === "closesOn" ? today() : undefined} step={field.type === "number" ? "any" : undefined} value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />}</label>)}
          <div className="flex gap-2"><button className="ibm-btn-primary px-4 py-2" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create"}</button>{editing && <button className="ibm-btn-secondary px-4 py-2" type="button" onClick={() => { setEditing(""); setValues({}); }}>Cancel</button>}</div>
          {message && <p role="status" className="text-sm">{message}</p>}
        </form>
        <div className="space-y-4">
          {app === "textile-exports" && <div className="ibm-panel p-5"><h2 className="font-semibold">Route comparison</h2><p className="mt-2 text-sm">All estimates must use the same currency and comparable goods value. Duty rates must come from a customs adviser; this calculator does not determine origin or legal tariff treatment.</p><p className="mt-2 text-sm">Cases: {records.filter((item) => item.kind === "shipment").length} · Approved: {records.filter((item) => item.kind === "shipment" && item.status === "approved").length}</p><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Case</th><th>Market</th><th>Landed estimate</th><th>Days</th></tr></thead><tbody>{records.filter((item) => item.kind === "route-option").sort((a, b) => Number(a.payload.landedEstimate) - Number(b.payload.landedEstimate)).map((item) => <tr key={item.id}><td>{records.find((row) => row.id === item.payload.shipmentId)?.title || "Unknown"}</td><td>{item.payload.market}</td><td>{Number(item.payload.landedEstimate).toLocaleString("en-IN")}</td><td>{item.payload.transitDays}</td></tr>)}</tbody></table></div></div>}
          {app === "property-auctions" && <div className="ibm-panel p-5"><h2 className="font-semibold">Auction overview</h2><p className="mt-2 text-sm">Open listings: {openListings.length} · Simulated bids: {records.filter((item) => item.kind === "bid").length}</p><p className="mt-2 text-sm">A listing opens only after an admin reviews seller authority. A bidder needs admin verification before placing a simulated bid.</p><div className="mt-3 space-y-1 text-sm">{openListings.map((listing) => { const bids = records.filter((item) => item.kind === "bid" && item.payload.listingId === listing.id); const highest = Math.max(0, ...bids.map((bid) => Number(bid.payload.bidAmount))); return <p key={listing.id}>{listing.title}: {bids.length} bid(s), highest {highest ? `₹${highest.toLocaleString("en-IN")}` : "none"}</p>; })}</div></div>}
          {app === "stock-exchange" && <div className="ibm-panel p-5"><h2 className="font-semibold">Paper portfolio</h2>{holdings.length ? <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Symbol</th><th>Shares</th><th>Net paper cash spent</th><th>Value at manual price</th><th>Paper P&amp;L</th></tr></thead><tbody>{holdings.map((item) => <tr key={`${item.exchange}:${item.symbol}`}><td>{item.exchange}:{item.symbol}<span className="block text-xs text-[#525252]">Price date {item.priceAsOf}</span></td><td>{item.shares}</td><td>{item.cost.toLocaleString("en-IN")}</td><td>{item.marketValue.toLocaleString("en-IN")}</td><td>{item.paperPnl.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm">No paper positions yet. Add a symbol, then record a paper buy.</p>}</div>}
          <div className="ibm-panel p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Records ({visible.length})</h2><input aria-label="Filter records" placeholder="Filter records" className="rounded border p-2 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)} /></div>
            <div className="mt-3 max-h-[850px] space-y-3 overflow-y-auto">{visible.length ? visible.map((item) => <article key={item.id} className="rounded border bg-white p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{item.title}</strong><span className="rounded bg-[#edf5ff] px-2 py-1">{item.kind} · {item.status}</span></div><dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">{Object.entries(item.payload).filter(([, value]) => value !== null && value !== "").map(([key, value]) => <div key={key}><dt className="text-xs text-[#525252]">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="break-words">{String(value)}</dd></div>)}</dl><p className="mt-2 text-xs text-[#525252]">Created {item.createdAt.slice(0, 10)}</p><div className="mt-3 flex flex-wrap gap-2">{item.mine && item.status === "draft" && ["shipment", "listing", "instrument"].includes(item.kind) && <button className="ibm-btn-secondary px-3 py-1" onClick={() => { setKind(item.kind); setValues(Object.fromEntries(Object.entries(item.payload).map(([key, value]) => [key, String(value ?? "")] ))); setEditing(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>}{actions(item).map(([label, status]) => <button key={status} disabled={busy} className="ibm-btn-secondary px-3 py-1" onClick={() => setStatus(item.id, status)}>{label}</button>)}</div></article>) : <p className="text-sm text-[#525252]">No records yet.</p>}</div>
          </div>
        </div>
      </section>
    </>}
  </main></div></div>;
}
