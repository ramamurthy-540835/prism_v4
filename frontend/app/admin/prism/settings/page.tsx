"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { fetch("/api/prism/auth").then((r) => r.json()).then((data) => setIsAdmin(data.user?.role === "admin")); }, []);
  return <div className="min-h-screen bg-white text-[#161616]">
    <WorkbenchHeader />
    <div className="flex"><AppSidebar /><main className="flex-1 bg-[#f8faff] p-6 space-y-4">
      <div className="ibm-panel p-5"><h1 className="text-xl font-semibold">Settings</h1><p className="text-sm text-[#525252] mt-1">Workspace and governance settings</p></div>
      {isAdmin && <details className="ibm-panel p-5"><summary className="cursor-pointer font-semibold">Diagnostics</summary>
        <div className="text-sm text-[#525252] mt-4 space-y-2">
          <p>Project: <code>aidirac-503309</code> · Region: <code>us-central1</code></p>
          <p>Governance store: BigQuery dataset <code>aidirac-503309.prism</code></p>
          <p>Usage table: <code>prism_usage</code> · Routing table: <code>prism_model_routing</code> · Plans table: <code>prism_plans</code></p>
          <p>Model provider: Vertex AI. Credentials and secret values are never displayed here.</p>
        </div>
      </details>}
    </main></div>
  </div>;
}
