"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wrench, BookOpen, FileText, DollarSign,
  BarChart2, ScrollText, Settings, Home, Tag,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Admin Dashboard",  href: "/admin/prism",             icon: LayoutDashboard },
  { label: "Workbench",        href: "/admin/prism/workbench",   icon: Wrench },
  { label: "Prompt Library",   href: "/admin/prism/prompts",     icon: BookOpen },
  { label: "Plans",            href: "/admin/prism/plans",       icon: FileText },
  { label: "Pricing",          href: "/pricing",                 icon: Tag },
  { label: "Budgets",          href: "/admin/prism/budgets",     icon: DollarSign },
  { label: "Usage Analytics",  href: "/admin/prism/usage",       icon: BarChart2 },
  { label: "Audit Logs",       href: "/admin/prism/audit",       icon: ScrollText },
  { label: "Settings",         href: "/admin/prism/settings",    icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/prism") return pathname === "/admin/prism";
    return pathname.startsWith(href);
  };

  return (
    <aside style={{
      width: "240px",
      flexShrink: 0,
      borderRight: "1px solid #dcdcdc",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto"
    }}>
      {/* Logo block */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "16px",
        borderBottom: "1px solid #dcdcdc"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          background: "#0f62fe",
          borderRadius: "6px",
          flexShrink: 0
        }}>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "12px" }}>P</span>
        </div>
        <div>
          <div style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#161616",
            lineHeight: "1.2",
            margin: 0
          }}>PRISM</div>
          <div style={{
            fontSize: "10px",
            color: "#525252",
            lineHeight: "1.2",
            margin: "2px 0 0 0"
          }}>Governed AI Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                color: active ? "#0f62fe" : "#525252",
                background: active ? "#edf5ff" : "transparent",
                borderLeft: active ? "3px solid #0f62fe" : "3px solid transparent",
                fontSize: "14px",
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s"
              }}
            >
              <Icon size={16} style={{ color: active ? "#0f62fe" : "#8d8d8d" }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "12px 8px",
        borderTop: "1px solid #dcdcdc"
      }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "6px",
            textDecoration: "none",
            color: "#525252",
            fontSize: "13px",
            transition: "all 0.15s"
          }}
        >
          <Home size={14} style={{ color: "#8d8d8d" }} />
          <span>Home</span>
        </Link>
      </div>
    </aside>
  );
}
