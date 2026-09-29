"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Workbench", href: "/admin/prism/workbench" },
  { label: "Admin Dashboard", href: "/admin/prism" },
  { label: "Prompt Library", href: "/admin/prism/prompts" },
  { label: "Pricing", href: "/pricing" },
  { label: "Usage", href: "/admin/prism/usage" },
];

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[#dcdcdc] bg-white px-6"
      style={{ height: 56, fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}
    >
      {/* Left — logo + title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0f62fe]">
          <span className="text-white font-bold text-xs leading-none">P</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-semibold text-[#161616] leading-none">PRISM</span>
          <span className="text-[12px] text-[#525252] leading-none hidden sm:block">Governed AI Platform</span>
        </div>
      </div>

      {/* Center — nav links */}
      <nav className="hidden md:flex items-end gap-6 h-full pb-0">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center h-full text-sm transition-colors"
              style={{
                color: active ? "#0f62fe" : "#525252",
                borderBottom: active ? "2px solid #0f62fe" : "2px solid transparent",
                paddingBottom: 0,
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right — badges + future login */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="rounded border border-[#dcdcdc] bg-[#f4f7fb] px-2.5 py-1 text-xs text-[#525252]">DEV</span>
        <span className="rounded border border-[#dcdcdc] bg-white px-2.5 py-1 text-xs text-[#525252] hidden sm:block">
          test@mastechdigital.com
        </span>
        <button
          title="Authentication coming in next release"
          disabled
          className="rounded border border-[#dcdcdc] bg-white px-3 py-1.5 text-xs text-[#525252] opacity-50 cursor-not-allowed hidden md:block"
        >
          Login
        </button>
      </div>
    </header>
  );
}
