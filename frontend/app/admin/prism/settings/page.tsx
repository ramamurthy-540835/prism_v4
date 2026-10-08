"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState<{ id: string; email: string; name: string; active: boolean }[]>([]);
  const [issuedPassword, setIssuedPassword] = useState("");
  const [notice, setNotice] = useState("");
  const loadUsers = async () => {
    const response = await fetch("/api/prism/users/test");
    if (response.ok) setUsers(await response.json());
  };
  useEffect(() => { fetch("/api/prism/auth").then((r) => r.json()).then((data) => {
    const admin = data.user?.role === "admin";
    setIsAdmin(admin);
    if (admin) void loadUsers();
  }); }, []);
  const addUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setIssuedPassword(""); setNotice("");
    const response = await fetch("/api/prism/users/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error || "Could not add test user"); return; }
    setIssuedPassword(result.password);
    setNotice(`Test user ${result.email} added. Copy the temporary password now; it is shown only once.`);
    setName(""); setEmail("");
    await loadUsers();
  };
  return <div className="min-h-screen bg-white text-[#161616]">
    <WorkbenchHeader />
    <div className="flex"><AppSidebar /><main className="flex-1 bg-[#f8faff] p-6 space-y-4">
      <div className="ibm-panel p-5"><h1 className="text-xl font-semibold">Settings</h1><p className="text-sm text-[#525252] mt-1">Workspace and governance settings</p></div>
      {isAdmin && <section className="ibm-panel p-5 space-y-4">
        <div><h2 className="font-semibold">Test users</h2><p className="text-sm text-[#525252]">Add a Nature Labs member for testing. Share the generated password privately.</p></div>
        <form onSubmit={addUser} className="grid gap-3 max-w-xl">
          <label className="text-sm">Name<input className="block border rounded p-2 w-full" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="text-sm">Email<input className="block border rounded p-2 w-full" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="ibm-btn-primary p-2" type="submit">Add test user</button>
        </form>
        {notice && <p role="status" className="text-sm">{notice}</p>}
        {issuedPassword && <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm">
          Temporary password: <code className="break-all">{issuedPassword}</code>
          <button className="ml-3 underline" type="button" onClick={() => navigator.clipboard.writeText(issuedPassword)}>Copy</button>
        </div>}
        <div className="text-sm"><h3 className="font-medium mb-2">Existing test users</h3>
          {users.length ? <ul className="space-y-1">{users.map((user) => <li key={user.id}>{user.name} · {user.email} · {user.active ? "Active" : "Inactive"}</li>)}</ul> : <p className="text-[#525252]">No test users added yet.</p>}
        </div>
      </section>}
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
