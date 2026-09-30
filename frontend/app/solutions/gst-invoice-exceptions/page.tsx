import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck, TriangleAlert } from "lucide-react";
import TopNav from "@/components/TopNav";

const PAYMENT_PAGE = "https://rzp.io/rzp/CWbxTDSf";

export default function GstInvoiceExceptionsPage() {
  return (
    <main className="min-h-screen bg-[#f8faff] text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <TopNav />
      <div className="h-14" />
      <section className="border-b border-[#dcdcdc] bg-white"><div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#16803a]">PRISM solution · Finance operations</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">Resolve GST invoice exceptions with evidence, not guesswork.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#525252]">PRISM&apos;s GST Invoice Exception Agent investigates mismatches across invoices, purchase orders, goods receipts, GST return records, and approved vendor GSTINs. It is read-only by design and escalates uncertainty.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href={PAYMENT_PAGE} target="_blank" rel="noreferrer" className="rounded bg-[#0f62fe] px-5 py-3 text-sm font-semibold text-white">Secure early access via Razorpay <ArrowRight className="ml-1 inline" size={16} /></a><Link href="/pricing" className="rounded border border-[#0f62fe] px-5 py-3 text-sm font-semibold text-[#0f62fe]">View PRISM plans</Link></div>
        <p className="mt-3 text-xs text-[#525252]">Nature Labs payment page · GST tax invoice issued for every payment · access is activated after payment confirmation.</p>
      </div></section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-3">
        <Card icon={<FileSearch size={22} />} title="Investigates the evidence" body="Starts from the invoice, then checks the PO, receipt, GST return match, and vendor record only when each is relevant." />
        <Card icon={<ShieldCheck size={22} />} title="Protects financial decisions" body="A variance above ₹500, a missing document, or GSTIN ambiguity results in escalation—never an invented approval." />
        <Card icon={<CheckCircle2 size={22} />} title="Creates an auditable outcome" body="Each run returns a structured decision, reason, and tool evidence suitable for finance review." />
      </section>
      <section className="border-y border-[#dcdcdc] bg-white"><div className="mx-auto max-w-6xl px-6 py-12"><h2 className="text-2xl font-semibold">How a review runs</h2><ol className="mt-7 grid gap-4 md:grid-cols-4">{["Fetch the invoice", "Compare the purchase order", "Check receipt and GST match when needed", "Recommend or escalate"].map((step, index) => <li key={step} className="rounded border border-[#dcdcdc] p-4"><span className="text-sm font-semibold text-[#0f62fe]">0{index + 1}</span><p className="mt-3 text-sm font-medium">{step}</p></li>)}</ol></div></section>
      <section className="mx-auto max-w-6xl px-6 py-12"><div className="rounded-[10px] border border-[#f1c21b] bg-[#fff8df] p-5"><div className="flex gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-[#8e5600]" size={20} /><div><h2 className="font-semibold">Production connection required</h2><p className="mt-1 text-sm leading-6 text-[#525252]">The published agent ships with safe local fixtures. Your onboarding includes mapping it to your authorised ERP and GST systems with read-only service-account credentials. No payment, vendor communication, or ledger change is performed by the agent.</p></div></div></div></section>
    </main>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <article className="rounded-[10px] border border-[#dcdcdc] bg-white p-6"><div className="text-[#0f62fe]">{icon}</div><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#525252]">{body}</p></article>;
}
