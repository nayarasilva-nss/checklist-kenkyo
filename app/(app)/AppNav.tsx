"use client";

import { useState } from "react";
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

function buildGroups(profile: string, showRequisicoes: boolean): NavGroup[] {
  if (profile === "rh") {
    return [
      {
        label: "OPERAÇÃO",
        items: [
          { href: "/hoje", label: "Hoje" },
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
        ...(showRequisicoes ? [{ href: "/requisicoes", label: "Requisições" }] : []),
      ],
    },
    {
      label: "INDICADORES",
      items: [
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

type SheetOptionDef = { href: string; title: string; description: string };

function SheetOption({ href, title, description, onNavigate }: SheetOptionDef & { onNavigate: () => void }) {
  return (
    <Link href={href} className="sheet-option" onClick={onNavigate}>
      <span className="sheet-option-icon" />
      <span>
        <span className="sheet-option-title">{title}</span>
        <br />
        <span className="sheet-option-desc">{description}</span>
      </span>
      <span className="sheet-option-chevron">›</span>
    </Link>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-title">{title}</div>
        <div className="sheet-options">{children}</div>
        <button type="button" className="sheet-cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </>
  );
}

export function AppNav({
  userName,
  profile,
  jobFunctionName,
  canCreateAnomaly,
  canSubmitFilleting,
  canSubmitRestoIngesta,
  canWriteShiftLog,
  showRequisicoes,
}: {
  userName: string;
  profile: string;
  jobFunctionName: string | null;
  canCreateAnomaly: boolean;
  canSubmitFilleting: boolean;
  canSubmitRestoIngesta: boolean;
  canWriteShiftLog: boolean;
  showRequisicoes: boolean;
}) {
  const pathname = usePathname();
  const groups = buildGroups(profile, showRequisicoes);
  const scope =
    profile === "gestor" || profile === "rh"
      ? "Todas as unidades"
      : (jobFunctionName ?? "Sem função definida");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const registerOptions: SheetOptionDef[] = [
    ...(canCreateAnomaly
      ? [{ href: "/anomalias", title: "Anomalia", description: "Registrar uma ocorrência" }]
      : []),
    ...(showRequisicoes
      ? [{ href: "/requisicoes", title: "Requisição", description: "Pedir itens ao estoque" }]
      : []),
    ...(canSubmitRestoIngesta
      ? [{ href: "/perdas?tab=resto", title: "Resto ingesta", description: "Lançar desperdício do dia" }]
      : []),
    ...(canSubmitFilleting
      ? [{ href: "/perdas?tab=filetagem", title: "Filetagem", description: "Lançar filetagem de pescado" }]
      : []),
    ...(canWriteShiftLog
      ? [{ href: "/diario-de-bordo", title: "Diário de bordo", description: "Registrar o turno" }]
      : []),
  ];

  const moreOptions: SheetOptionDef[] = [
    { href: "/relatorio", title: "Relatórios", description: "Dia e semana" },
    { href: "/historico", title: "Histórico", description: "Atividades registradas" },
    { href: "/documentos", title: "Fichas e POPs", description: "Fichas técnicas e procedimentos" },
    ...(showRequisicoes
      ? [{ href: "/requisicoes", title: "Requisições", description: "Pedidos de estoque" }]
      : []),
    ...(profile === "gestor"
      ? [{ href: "/gerenciar", title: "Gerenciar", description: "Usuários, unidades e modelos" }]
      : []),
  ];

  return (
    <>
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
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav-link${isActive(item.href) ? " active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
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

      <nav className="mobile-bottom-bar">
        <Link href="/hoje" className={`mobile-nav-item${isActive("/hoje") ? " active" : ""}`}>
          <span className="mobile-nav-icon" />
          <span className="mobile-nav-label">Hoje</span>
        </Link>
        <Link
          href="/checklist"
          className={`mobile-nav-item${isActive("/checklist") ? " active" : ""}`}
        >
          <span className="mobile-nav-icon" />
          <span className="mobile-nav-label">Checklists</span>
        </Link>
        {registerOptions.length > 0 && (
          <button
            type="button"
            className="mobile-nav-fab"
            onClick={() => setRegisterOpen(true)}
            aria-label="Registrar"
          >
            +
          </button>
        )}
        <Link
          href="/diario-de-bordo"
          className={`mobile-nav-item${isActive("/diario-de-bordo") ? " active" : ""}`}
        >
          <span className="mobile-nav-icon" />
          <span className="mobile-nav-label">Diário</span>
        </Link>
        <button type="button" className="mobile-nav-item" onClick={() => setMoreOpen(true)}>
          <span className="mobile-nav-icon" />
          <span className="mobile-nav-label">Mais</span>
        </button>
      </nav>

      {registerOpen && (
        <BottomSheet title="Registrar" onClose={() => setRegisterOpen(false)}>
          {registerOptions.map((opt) => (
            <SheetOption key={opt.href} {...opt} onNavigate={() => setRegisterOpen(false)} />
          ))}
        </BottomSheet>
      )}

      {moreOpen && (
        <BottomSheet title="Mais" onClose={() => setMoreOpen(false)}>
          {moreOptions.map((opt) => (
            <SheetOption key={opt.href} {...opt} onNavigate={() => setMoreOpen(false)} />
          ))}
          <form action={logout}>
            <button type="submit" className="sheet-option" style={{ width: "100%" }}>
              <span className="sheet-option-icon" />
              <span>
                <span className="sheet-option-title">Sair</span>
              </span>
            </button>
          </form>
        </BottomSheet>
      )}
    </>
  );
}
