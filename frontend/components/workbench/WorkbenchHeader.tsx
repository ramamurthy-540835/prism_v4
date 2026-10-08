"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function WorkbenchHeader() {
  const [email, setEmail] = useState("");
  useEffect(() => { fetch("/api/prism/auth").then((r) => r.json()).then((data) => setEmail(data.user?.email || "")); }, []);
  return <header className="h-14 border-b border-[#dcdcdc] bg-white px-6 flex items-center justify-between shrink-0">
    <div><h1 className="text-base font-semibold">PRISM Workbench</h1><p className="text-xs text-[#525252]">Governed AI Platform</p></div>
    <div className="flex items-center gap-2 text-xs"><span className="rounded border p-1">{process.env.NEXT_PUBLIC_PRISM_ENV || "Production"}</span>
      {email ? <span className="rounded border p-1">{email}</span> : <Link href="/login" className="text-[#0f62fe]">Sign in</Link>}</div>
  </header>;
}
