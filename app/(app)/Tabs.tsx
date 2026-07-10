"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/checklist", label: "✓ Checklist" },
  { href: "/relatorio", label: "📈 Relatório" },
  { href: "/historico", label: "📋 Histórico" },
] as const;

export function Tabs({ showManage }: { showManage: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="tabs">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`tab-link ${pathname.startsWith(tab.href) ? "active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
      {showManage && (
        <Link
          href="/gerenciar"
          className={`tab-link ${pathname.startsWith("/gerenciar") ? "active" : ""}`}
        >
          ⚙️ Gerenciar
        </Link>
      )}
    </nav>
  );
}
