"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";
import { projectBriefs } from "@/config/project-briefs";
import { iotSignals } from "@/config/iot-signals";

const domains = ["Tax & GST", "Income Tax", "Textile Exports", "Property Auctions", "Finance", "Stock Exchange", "Industrial IoT", "Climate/IPCC", "Agriculture", "Careers", "Sales", "Other"];
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [domainTag, setDomainTag] = useState(domains[0]);
  const [description, setDescription] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [message, setMessage] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRepositoryUrl, setEditRepositoryUrl] = useState("");
  const load = () => fetch("/api/prism/projects").then((r) => r.json()).then((data) => setProjects(Array.isArray(data) ? data : []));
  useEffect(() => { load(); }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/prism/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, domainTag, description, repositoryUrl, visibility }) });
    const result = await response.json();
    setMessage(response.ok ? "Project sent for admin approval." : result.error || "Could not create project.");
    if (response.ok) { setName(""); setDescription(""); setRepositoryUrl(""); load(); }
  };
  const addMember = async (projectId: string) => {
    const response = await fetch("/api/prism/projects/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, email: memberEmail }) });
    const result = await response.json();
    setMessage(response.ok ? "Member added." : result.error || "Could not add member.");
    if (response.ok) setMemberEmail("");
  };
  const saveDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/prism/projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: editingProjectId, description: editDescription, repositoryUrl: editRepositoryUrl }) });
    const result = await response.json();
    setMessage(response.ok ? "Project details updated." : result.error || "Could not update project.");
    if (response.ok) { setEditingProjectId(""); load(); }
  };
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar />
    <main className="flex-1 bg-[#f8faff] p-6 space-y-5"><h1 className="text-2xl font-semibold">Projects</h1>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Client workstreams</h2><p className="text-sm text-[#525252]">Select a brief to fill the form. Projects still go through admin approval.</p>
        <div className="grid md:grid-cols-2 gap-3">{projectBriefs.map((brief) => <div key={brief.name} className="ibm-panel p-4 space-y-2">
          <h3 className="font-semibold">{brief.name}</h3><p className="text-sm text-[#525252]">{brief.description}</p>
          {brief.repositoryUrl ? <a className="text-sm text-blue-700 underline" href={brief.repositoryUrl} target="_blank" rel="noreferrer">Git repository</a> : <p className="text-sm text-[#525252]">{["Textile Exports", "Property Auctions", "Stock Exchange"].includes(brief.name) ? "Application built in PRISM" : "Repository URL needed"}</p>}
          {brief.applicationUrl && <Link className="ml-4 text-sm text-blue-700 underline" href="/admin/prism/partners/gst">Partner GST access</Link>}
          {(["Textile Exports", "Property Auctions", "Stock Exchange"].includes(brief.name)) && <Link className="ml-4 text-sm text-blue-700 underline" href={`/admin/prism/${brief.name.toLowerCase().replaceAll(" ", "-")}`}>Open application</Link>}
          {brief.domainTag === "Industrial IoT" && <details className="text-sm"><summary className="cursor-pointer text-blue-700">View cement-ai sensor map</summary><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(iotSignals).map(([group, signals]) => <div key={group}><strong>{group}</strong><ul className="list-disc pl-5">{signals.map(([key, label, unit]) => <li key={key}>{label} ({unit})</li>)}</ul></div>)}</div></details>}
          <div><button className="ibm-btn-secondary px-3 py-2" type="button" onClick={() => { setName(brief.name); setDomainTag(brief.domainTag); setDescription(brief.description); setRepositoryUrl(brief.repositoryUrl); setVisibility("private"); document.getElementById("project-form")?.scrollIntoView({ behavior: "smooth" }); }}>Use this brief</button></div>
        </div>)}</div>
      </section>
      <form id="project-form" onSubmit={create} className="ibm-panel p-5 grid gap-3 max-w-xl"><h2 className="font-semibold">Create a project</h2>
        <label>Name<input className="block border rounded p-2 w-full" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /></label>
        <label>Domain tag<select className="block border rounded p-2 w-full" value={domainTag} onChange={(e) => setDomainTag(e.target.value)}>{domains.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label>Brief<textarea className="block border rounded p-2 w-full min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} /></label>
        <label>GitHub repository URL (optional)<input className="block border rounded p-2 w-full" type="url" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/owner/repository" maxLength={500} /></label>
        <label>Visibility<select className="block border rounded p-2 w-full" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Public to Nature Labs</option><option value="private">Private to members</option></select></label>
        <button className="ibm-btn-primary p-2" type="submit">Request project</button>{message && <p role="status">{message}</p>}
      </form>
      <div className="grid md:grid-cols-2 gap-4">{projects.map((project) => <div key={project.id} className="ibm-panel p-5">
        <h2 className="font-semibold"><Link className="text-blue-700 underline" href={`/admin/prism/projects/${project.id}`}>{project.name}</Link></h2><p className="text-sm text-[#525252]">{project.domain_tag || "Other"} · {project.visibility} · {project.approval_status || "approved"}</p>
        {project.description && <p className="mt-2 text-sm whitespace-pre-wrap">{project.description}</p>}
        {project.repository_url ? <a className="mt-2 block text-sm text-blue-700 underline" href={project.repository_url} target="_blank" rel="noreferrer">Git repository</a> : <p className="mt-2 text-sm text-amber-700">Repository URL needed</p>}
        {project.can_edit && (editingProjectId === project.id ? <form onSubmit={saveDetails} className="mt-3 grid gap-2">
          <label>Brief<textarea className="block border rounded p-2 w-full min-h-24" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={3000} /></label>
          <label>GitHub repository URL<input className="block border rounded p-2 w-full" type="url" value={editRepositoryUrl} onChange={(e) => setEditRepositoryUrl(e.target.value)} maxLength={500} /></label>
          <div className="flex gap-2"><button className="ibm-btn-primary px-3 py-2" type="submit">Save details</button><button className="ibm-btn-secondary px-3 py-2" type="button" onClick={() => setEditingProjectId("")}>Cancel</button></div>
        </form> : <button className="ibm-btn-secondary mt-3 px-3 py-2" type="button" onClick={() => { setEditingProjectId(project.id); setEditDescription(project.description || ""); setEditRepositoryUrl(project.repository_url || ""); }}>Edit details</button>)}
        {project.visibility === "private" && <div className="mt-3 flex gap-2"><input type="email" aria-label={`Member email for ${project.name}`} placeholder="Member email" className="border rounded p-2 flex-1" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /><button className="ibm-btn-secondary px-3" onClick={() => addMember(project.id)}>Add member</button></div>}
      </div>)}</div>
    </main></div></div>;
}
