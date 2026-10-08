"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

const domains = ["Tax & GST", "Income Tax", "Climate/IPCC", "Agriculture", "Careers", "Sales", "Other"];
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [domainTag, setDomainTag] = useState(domains[0]);
  const [visibility, setVisibility] = useState("public");
  const [message, setMessage] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const load = () => fetch("/api/prism/projects").then((r) => r.json()).then((data) => setProjects(Array.isArray(data) ? data : []));
  useEffect(() => { load(); }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/prism/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, domainTag, visibility }) });
    const result = await response.json();
    setMessage(response.ok ? "Project sent for admin approval." : result.error || "Could not create project.");
    if (response.ok) { setName(""); load(); }
  };
  const addMember = async (projectId: string) => {
    const response = await fetch("/api/prism/projects/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, email: memberEmail }) });
    const result = await response.json();
    setMessage(response.ok ? "Member added." : result.error || "Could not add member.");
    if (response.ok) setMemberEmail("");
  };
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar />
    <main className="flex-1 bg-[#f8faff] p-6 space-y-5"><h1 className="text-2xl font-semibold">Projects</h1>
      <form onSubmit={create} className="ibm-panel p-5 grid gap-3 max-w-xl"><h2 className="font-semibold">Create a project</h2>
        <label>Name<input className="block border rounded p-2 w-full" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /></label>
        <label>Domain tag<select className="block border rounded p-2 w-full" value={domainTag} onChange={(e) => setDomainTag(e.target.value)}>{domains.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label>Visibility<select className="block border rounded p-2 w-full" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Public to Nature Labs</option><option value="private">Private to members</option></select></label>
        <button className="ibm-btn-primary p-2" type="submit">Request project</button>{message && <p role="status">{message}</p>}
      </form>
      <div className="grid md:grid-cols-2 gap-4">{projects.map((project) => <div key={project.id} className="ibm-panel p-5">
        <h2 className="font-semibold">{project.name}</h2><p className="text-sm text-[#525252]">{project.domain_tag || "Other"} · {project.visibility} · {project.approval_status || "approved"}</p>
        {project.visibility === "private" && <div className="mt-3 flex gap-2"><input type="email" aria-label={`Member email for ${project.name}`} placeholder="Member email" className="border rounded p-2 flex-1" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /><button className="ibm-btn-secondary px-3" onClick={() => addMember(project.id)}>Add member</button></div>}
      </div>)}</div>
    </main></div></div>;
}
