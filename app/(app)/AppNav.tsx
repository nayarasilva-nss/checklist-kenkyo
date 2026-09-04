"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const PROFILE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  gerente: "Gerente",
  lider: "Líder",
  rh: "RH",
};

function buildGroups(profile: string): NavGroup[] {
  if (profile === "rh") {
    return [
      {
        label: "OPERAÇÃO",
        items: [
          { href: "/anomalias", label: "Anomalias" },
          { href: "/diario-de-bordo", label: "Diário de bordo" },
        ],
      },
    ];
  }

  const groups: NavGroup[] = [
    {
      label: "OPERAÇÃO",
      items: [
        { href: "/hoje", label: "Hoje" },
        { href: "/checklist", label: "Checklists" },
        { href: "/diario-de-bordo", label: "Diário de bordo" },
        { href: "/anomalias", label: "Anomalias" },
      ],
    },
    {
      label: "INDICADORES",
      items: [
        { href: "/dashboard", label: "Painel" },
        { href: "/perdas", label: "Perdas" },
        { href: "/relatorio", label: "Relatórios" },
        { href: "/historico", label: "Histórico" },
      ],
    },
    {
      label: "BIBLIOTECA",
      items: [{ href: "/documentos", label: "Fichas e POPs" }],
    },
  ];

  if (profile === "gestor") {
    groups.push({
      label: "SISTEMA",
      items: [{ href: "/gerenciar", label: "Gerenciar" }],
    });
  }

  return groups;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export function AppNav({
  userName,
  profile,
  jobFunctionName,
}: {
  userName: string;
  profile: string;
  jobFunctionName: string | null;
}) {
  const pathname = usePathname();
  const groups = buildGroups(profile);
  const scope =
    profile === "gestor" || profile === "rh"
      ? "Todas as unidades"
      : (jobFunctionName ?? "Sem função definida");

  return (
    <aside className="app-nav">
      <Link href="/hoje" className="app-nav-brand">
        <Image src="/kenkyo-logo.png" alt="Kenkyo" width={28} height={28} />
        <span>Kenkyo</span>
      </Link>

      <nav className="app-nav-groups">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="app-nav-group-label">{group.label}</div>
            <div className="app-nav-items">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav-link${active ? " active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="app-nav-footer">
        <div className="app-nav-avatar">{initials(userName)}</div>
        <div className="app-nav-user">
          <div className="app-nav-user-name">{userName}</div>
          <div className="app-nav-user-scope">
            {PROFILE_LABELS[profile] ?? profile} · {scope}
          </div>
        </div>
        <form action={logout}>
          <button className="app-nav-logout" type="submit" aria-label="Sair">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
