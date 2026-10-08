"use client";
import Link from "next/link";
import TopNav from "@/components/TopNav";

const plans = [
  { name: "Starter", price: "₹199", audience: "Individuals and small projects", users: "1 user", features: ["Governed model routing", "Prompt library", "Usage and safety audit", "Budget warnings at 80% and 100%"] },
  { name: "Team", price: "Contact sales", audience: "Teams working across projects", users: "Up to 20 users", features: ["Everything in Starter", "Shared projects", "Team usage dashboard", "Role-based access"] },
  { name: "Enterprise", price: "Contact sales", audience: "Large and regulated organisations", users: "Custom seats", features: ["Everything in Team", "Custom governance policies", "Dedicated support", "Custom prompt library"] },
];

export default function PricingPage() {
  return <div className="min-h-screen bg-[#f8faff] text-[#161616]">
    <TopNav />
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12"><h1 className="text-4xl font-bold">Postpaid plans for governed AI</h1>
        <p className="text-[#525252] mt-4">A monthly base plus metered utilisation. Pay in arrears for governed tasks that actually executed.</p></div>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => <section key={plan.name} className="bg-white border border-[#dcdcdc] rounded-xl p-7 flex flex-col">
          <h2 className="text-xl font-semibold">{plan.name}</h2><p className="text-sm text-[#525252] mt-2">{plan.audience}</p>
          <p className="text-3xl font-bold mt-8">{plan.price}{plan.name === "Starter" && <span className="text-sm font-normal text-[#525252]"> / month base</span>}</p>
          <p className="text-sm text-[#525252] mt-1">+ metered usage · billed monthly in arrears</p>
          <ul className="my-8 space-y-3 text-sm flex-1"><li>✓ {plan.users}</li>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
          <Link className="block rounded bg-[#0f62fe] text-white text-center px-4 py-3" href="mailto:ai@nelture.ai?subject=PRISM%20plan%20enquiry">Talk to us</Link>
        </section>)}
      </div>
      <section className="bg-white border border-[#dcdcdc] rounded-xl p-8 mt-12"><h2 className="text-xl font-semibold">How do budgets work?</h2>
        <p className="mt-3 text-[#525252]">You&apos;re on postpaid billing. We warn you at 80 % and 100 % of your budget and keep working; you pay for what actually executed.</p>
        <p className="mt-3 text-[#525252]">Safety violations can stop a request to protect sensitive information and enforce policy.</p>
      </section>
    </main>
  </div>;
}
