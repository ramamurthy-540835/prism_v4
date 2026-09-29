"use client";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function LoginPage() {
  const handleSubmit = () => {
    alert("Authentication not yet enabled. Access the platform directly.");
  };

  return (
    <div className="min-h-screen bg-[#f8faff]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <TopNav />
      <div style={{ height: 56 }} />

      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
        <div className="w-full max-w-[440px] rounded-[10px] border border-[#dcdcdc] bg-white p-10 shadow-sm">

          {/* Logo + title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0f62fe]">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <div className="text-[18px] font-semibold text-[#161616] leading-none">PRISM</div>
              <div className="text-[11px] text-[#525252] leading-none mt-0.5">Governed AI Platform</div>
            </div>
          </div>

          <h1 className="text-[22px] font-semibold text-[#161616] mb-6">Sign in to PRISM</h1>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wide text-[#525252] mb-1">Email</label>
            <input
              type="email"
              placeholder="you@mastechdigital.com"
              className="w-full rounded border border-[#dcdcdc] px-3 py-2.5 text-sm text-[#161616] outline-none focus:border-[#0f62fe]"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-xs uppercase tracking-wide text-[#525252] mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded border border-[#dcdcdc] px-3 py-2.5 text-sm text-[#161616] outline-none focus:border-[#0f62fe]"
            />
          </div>

          {/* Sign in button */}
          <button
            onClick={handleSubmit}
            type="button"
            className="w-full rounded bg-[#0f62fe] py-2.5 text-sm font-semibold text-white"
          >
            Sign In
          </button>

          <p className="mt-4 text-center text-[13px] text-[#525252]">
            Authentication not yet enabled. Access the platform directly.
          </p>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#0f62fe] hover:underline">
              ← Back to PRISM
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
