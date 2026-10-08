"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/prism/plans").then((r) => r.json()).then((rows) => setPlans(Array.isArray(rows) ? rows : [])).finally(() => setLoading(false)); }, []);
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar />
    <main className="flex-1 bg-[#f8faff] p-6 space-y-5"><h1 className="text-2xl font-semibold">Postpaid plans</h1>
      {loading ? <p>Loading plans...</p> : plans.length === 0 ? <p>No active plans available.</p> : <div className="grid md:grid-cols-3 gap-4">{plans.map((plan) =>
        <section key={plan.planId} className="ibm-panel p-6"><h2 className="text-xl font-semibold">{plan.name}</h2>
          <p className="mt-3 text-2xl font-bold">{plan.monthlyBaseInr != null ? `₹${Number(plan.monthlyBaseInr).toFixed(0)} / month base` : "Contact sales"}</p>
          <p className="mt-2 text-sm text-[#525252]">+ metered governed usage, billed monthly in arrears</p>
          <p className="mt-4 text-sm">{plan.description}</p>
        </section>)}</div>}
    </main></div></div>;
}
