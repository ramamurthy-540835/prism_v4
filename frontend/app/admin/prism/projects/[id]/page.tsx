"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";
import { projectBriefs } from "@/config/project-briefs";
import { iotSignals, iotSignalUnits } from "@/config/iot-signals";

type Project = { id: string; name: string; description?: string; domain_tag?: string; repository_url?: string; approval_status?: string; can_edit?: boolean };
type Reading = { id: string; deviceId: string; plantId: string; lineId: string; observedAt: string; receivedAt: string; signals: Record<string, number> };
type Device = { id: string; device_id: string; active: boolean; created_at: string };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [newKey, setNewKey] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/prism/projects", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Sign in to view this project");
      const rows = await response.json();
      const found = Array.isArray(rows) ? rows.find((row: Project) => row.id === id) : null;
      if (!found) throw new Error("Project not found or access denied");
      setProject(found);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load project"));
  }, [id]);
  useEffect(() => {
    if (project?.domain_tag !== "Industrial IoT") return;
    const load = () => {
      fetch(`/api/prism/iot/readings?projectId=${encodeURIComponent(id)}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load sensor readings")))
        .then((rows) => setReadings(rows)).catch((cause) => setError(cause.message));
      fetch(`/api/prism/iot/devices?projectId=${encodeURIComponent(id)}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load devices")))
        .then((rows) => setDevices(rows)).catch((cause) => setError(cause.message));
    };
    load();
    const timer = window.setInterval(load, 10_000);
    return () => window.clearInterval(timer);
  }, [id, project?.domain_tag]);
  const registerDevice = async () => {
    setMessage("");
    const response = await fetch("/api/prism/iot/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, deviceId }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Could not register device"); return; }
    setNewKey(result.key);
    setDeviceId("");
    setDevices((current) => [{ id: result.id, device_id: result.deviceId, active: true, created_at: new Date().toISOString() }, ...current]);
  };
  const revokeDevice = async (deviceKeyId: string) => {
    const response = await fetch("/api/prism/iot/devices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, deviceKeyId }) });
    const result = await response.json();
    setMessage(response.ok ? "Device key revoked." : result.error || "Could not revoke device key");
    if (response.ok) setDevices((current) => current.map((device) => device.id === deviceKeyId ? { ...device, active: false } : device));
  };
  const brief = projectBriefs.find((item) => item.name === project?.name);
  const latest = readings[0];
  const latestAge = latest ? Date.now() - new Date(latest.observedAt).getTime() : Infinity;
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar />
    <main className="flex-1 bg-[#f8faff] p-6 space-y-5 min-w-0">
      <Link className="text-sm text-blue-700 underline" href="/admin/prism/projects">← Projects</Link>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {project && <>
        <header><h1 className="text-2xl font-semibold">{project.name}</h1><p className="text-sm text-[#525252]">{project.domain_tag} · {project.approval_status || "approved"}</p></header>
        <section className="ibm-panel p-5 space-y-3"><h2 className="font-semibold">Project brief</h2><p className="text-sm whitespace-pre-wrap">{project.description || brief?.description || "No brief yet."}</p>
          {project.repository_url && <a className="block text-sm text-blue-700 underline" href={project.repository_url} target="_blank" rel="noreferrer">View source repository</a>}
          {brief?.applicationUrl && <Link className="block text-sm text-blue-700 underline" href="/admin/prism/partners/gst">Partner GST access and feedback</Link>}
        </section>
        {project.domain_tag === "Industrial IoT" && <>
          <section className="ibm-panel p-5 space-y-3"><h2 className="font-semibold">Latest sensor readings</h2><p className="text-sm">{latest ? `${latest.plantId} / ${latest.lineId} · ${latest.deviceId} · observed ${new Date(latest.observedAt).toLocaleString()} · ${latestAge <= 300_000 ? "Recent" : "Stale"}` : "No device readings received yet."}</p>
            {latest && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(latest.signals).map(([key, value]) => <div key={key} className="rounded border bg-white p-3"><p className="text-xs text-[#525252]">{key.replaceAll("_", " ")}</p><p className="text-xl font-semibold">{value} <span className="text-sm font-normal">{iotSignalUnits[key] || ""}</span></p></div>)}</div>}
            <p className="text-xs text-[#525252]">Refreshes every 10 seconds. Readings are source values; PRISM does not infer accuracy or issue control commands.</p>
          </section>
          <section className="ibm-panel p-5 space-y-3"><h2 className="font-semibold">Cement AI sensor map</h2><p className="text-sm text-[#525252]">Fields follow the OT signals schema in the cement-ai repository. Map each plant tag and unit to these fields before connecting a gateway.</p>
            <div className="grid gap-4 lg:grid-cols-2">{Object.entries(iotSignals).map(([group, signals]) => <div key={group}><h3 className="font-medium">{group}</h3><ul className="mt-2 space-y-1 text-sm">{signals.map(([key, label, unit]) => <li key={key} className="flex justify-between gap-3 border-b py-1"><span>{label}<span className="ml-2 text-xs text-[#666]">{key}</span></span><span>{unit}</span></li>)}</ul></div>)}</div>
          </section>
          <section className="ibm-panel p-5 space-y-3"><h2 className="font-semibold">Gateway access</h2><p className="text-sm">A gateway sends HTTPS POST requests to <code>/api/prism/iot/readings</code> with <code>x-prism-device-key</code>. Body: <code>{'{"plantId":"plant_01","lineId":"line_1","observedAt":"2026-10-20T10:00:00Z","signals":{"total_power_kw":1850}}'}</code></p>
            {project.can_edit && <div className="flex gap-2"><input className="border rounded p-2" aria-label="Device ID" placeholder="Device ID" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} /><button className="ibm-btn-primary px-3" type="button" onClick={registerDevice}>Register device</button></div>}
            {newKey && <div className="rounded border border-amber-400 bg-amber-50 p-3"><p className="text-sm font-medium">Save this key now. It will not be shown again.</p><code className="break-all text-sm">{newKey}</code><button type="button" className="ml-2 text-sm underline" onClick={() => setNewKey("")}>Dismiss</button></div>}
            {message && <p role="status" className="text-sm">{message}</p>}
            <ul className="space-y-2 text-sm">{devices.map((device) => <li key={device.id} className="flex items-center justify-between gap-3 border-b pb-2"><span>{device.device_id} · {device.active ? "Active" : "Revoked"}</span>{project.can_edit && device.active && <button type="button" className="text-red-700 underline" onClick={() => revokeDevice(device.id)}>Revoke</button>}</li>)}</ul>
          </section>
          <section className="ibm-panel p-5"><h2 className="font-semibold">Recent observations</h2><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Observed</th><th className="p-2">Plant / line</th><th className="p-2">Device</th><th className="p-2">Signals</th></tr></thead><tbody>{readings.map((row) => <tr key={row.id} className="border-t"><td className="p-2">{new Date(row.observedAt).toLocaleString()}</td><td className="p-2">{row.plantId} / {row.lineId}</td><td className="p-2">{row.deviceId}</td><td className="p-2">{Object.keys(row.signals).length}</td></tr>)}</tbody></table></div></section>
        </>}
      </>}
    </main></div></div>;
}
