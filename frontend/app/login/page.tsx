"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const response = await fetch("/api/prism/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (response.ok) router.push("/admin/prism"); else setError("Sign-in failed. Check your credentials.");
  };
  return <div className="min-h-screen bg-[#f8faff]"><TopNav /><main className="flex items-center justify-center min-h-screen p-6">
    <form onSubmit={submit} className="bg-white border rounded-xl p-8 w-full max-w-md space-y-5">
      <h1 className="text-2xl font-semibold">Sign in to PRISM</h1>
      <label className="block text-sm">Email<input type="email" autoComplete="username" required className="block border rounded p-3 w-full mt-1" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block text-sm">Password<input type="password" autoComplete="current-password" required className="block border rounded p-3 w-full mt-1" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      <button type="submit" className="ibm-btn-primary w-full p-3">Sign in</button>
    </form>
  </main></div>;
}
