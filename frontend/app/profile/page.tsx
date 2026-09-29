import Link from "next/link";
import TopNav from "@/components/TopNav";

function Toggle({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#dcdcdc] last:border-0">
      <div>
        <span className="text-sm text-[#161616]">{label}</span>
        <span className="ml-2 text-xs text-[#525252] border border-[#dcdcdc] rounded px-1.5 py-0.5">Coming soon</span>
      </div>
      <div
        title="Coming soon"
        className="w-10 h-5 rounded-full bg-[#dcdcdc] opacity-50 cursor-not-allowed relative"
      >
        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#f8faff]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <TopNav />
      <div style={{ height: 56 }} />

      <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-12">
        <div className="w-full max-w-[480px] space-y-4">

          {/* Profile card */}
          <div className="rounded-[10px] border border-[#dcdcdc] bg-white p-8">

            {/* Avatar + name */}
            <div className="flex items-center gap-5 mb-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-[18px] shrink-0"
                style={{ background: "#0f62fe" }}
              >
                VR
              </div>
              <div>
                <div className="text-[20px] font-semibold text-[#161616]">V Ramamurthy</div>
                <div className="text-[14px] text-[#525252]">test@mastechdigital.com</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "#24a14822", color: "#24a148" }}>
                    Admin
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm border-t border-[#dcdcdc] pt-5">
              {[
                ["Organisation", "Mastech Digital"],
                ["Plan", "Enterprise"],
                ["User ID", "test-user"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[#525252]">{label}</span>
                  <span className="font-medium text-[#161616]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences card */}
          <div className="rounded-[10px] border border-[#dcdcdc] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#161616] mb-3">Preferences</h2>
            <Toggle label="Dark mode" />
            <Toggle label="Email notifications" />
            <Toggle label="API access" />
          </div>

          {/* Footer note */}
          <p className="text-center text-[13px] text-[#525252]">
            Profile management will be available in the next release.
          </p>

          <div className="text-center">
            <Link href="/" className="text-sm text-[#0f62fe] hover:underline">← Back to PRISM</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
