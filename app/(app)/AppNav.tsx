"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { isGestorProfile } from "@/lib/auth/profile";
import { ThemeSegmented, ThemeToggle } from "./ThemeToggle";

type NavItem = { href: string; label: string; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

const PROFILE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  gerente: "Gerente",
  lider: "Líder",
  rh: "RH",
  master: "Master",
};

function buildGroups(
  profile: string,
  showRequisicoes: boolean,
  showContagem: boolean,
  showCaixa: boolean,
  showEscala: boolean,
  showEstoque: boolean,
  showSolicitacoes: boolean,
  showFormularios: boolean,
  showPlataforma: boolean,
  pendingAuditCount: number,
): NavGroup[] {
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
        ...(showEstoque ? [{ href: "/estoque", label: "Estoque" }] : []),
        ...(showContagem ? [{ href: "/contagem", label: "Contagem" }] : []),
        ...(showCaixa ? [{ href: "/caixa", label: "Fechamento de caixa" }] : []),
        ...(showSolicitacoes ? [{ href: "/solicitacoes", label: "Solicitações" }] : []),
        ...(showEscala ? [{ href: "/escala", label: "Escala" }] : []),
      ],
    },
    {
      label: "INDICADORES",
      items: [
        { href: "/perdas", label: "Perdas" },
        ...(showFormularios ? [{ href: "/formularios", label: "Formulários" }] : []),
        ...(isGestorProfile(profile) ? [{ href: "/indicadores", label: "Indicadores" }] : []),
        ...(isGestorProfile(profile) ? [{ href: "/auditorias", label: "Auditorias", badge: pendingAuditCount }] : []),
        { href: "/relatorio", label: "Relatórios" },
        { href: "/historico", label: "Histórico" },
      ],
    },
    {
      label: "BIBLIOTECA",
      items: [{ href: "/documentos", label: "Fichas e POPs" }],
    },
  ];

  if (isGestorProfile(profile)) {
    groups.push({
      label: "SISTEMA",
      items: [
        { href: "/gerenciar", label: "Gerenciar" },
        ...(showPlataforma ? [{ href: "/plataforma", label: "Plataforma" }] : []),
      ],
    });
  }

  return groups;
}

const ICONES = {
  hoje: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  checklists: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  diario: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5",
  mais: "M4 6h16M4 12h16M4 18h16",
} as const;

function Icone({ nome }: { nome: keyof typeof ICONES }) {
  return (
    <svg className="mobile-nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONES[nome]} />
    </svg>
  );
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
  header,
  onClose,
  children,
}: {
  title?: string;
  header?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        {header ?? <div className="bottom-sheet-title">{title}</div>}
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
  orgName,
  orgLogoUrl,
  canCreateAnomaly,
  canSubmitFilleting,
  canSubmitRestoIngesta,
  canWriteShiftLog,
  showRequisicoes,
  showContagem = false,
  showCaixa = false,
  showEscala = false,
  showEstoque = false,
  canCreateRequisicao,
  showSolicitacoes,
  showFormularios,
  showPlataforma,
  pendingAuditCount,
  contexto,
}: {
  userName: string;
  profile: string;
  jobFunctionName: string | null;
  orgName: string;
  orgLogoUrl: string;
  canCreateAnomaly: boolean;
  canSubmitFilleting: boolean;
  canSubmitRestoIngesta: boolean;
  canWriteShiftLog: boolean;
  showRequisicoes: boolean;
  showContagem?: boolean;
  showCaixa?: boolean;
  showEscala?: boolean;
  showEstoque?: boolean;
  canCreateRequisicao: boolean;
  showSolicitacoes: boolean;
  showFormularios: boolean;
  showPlataforma: boolean;
  pendingAuditCount: number;
  // Unidade de hoje e função de hoje: ficam aqui, no menu, e não numa faixa no topo da página.
  contexto?: React.ReactNode;
}) {
  const pathname = usePathname();
  const groups = buildGroups(profile, showRequisicoes, showContagem, showCaixa, showEscala, showEstoque, showSolicitacoes, showFormularios, showPlataforma, pendingAuditCount);
  const scope =
    isGestorProfile(profile) || profile === "rh"
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
    ...(canCreateRequisicao
      ? [{ href: "/requisicoes", title: "Requisição", description: "Pedir itens ao estoque" }]
      : []),
    ...(showSolicitacoes
      ? [{ href: "/solicitacoes", title: "Solicitação", description: "Pedir item avulso (ex: rádio, lâmpada)" }]
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
    ...(showEstoque ? [{ href: "/estoque", title: "Estoque", description: "Saldo e alertas da unidade" }] : []),
    ...(showEscala ? [{ href: "/escala", title: "Escala", description: "Folgas do mês" }] : []),
    ...(showSolicitacoes
      ? [{ href: "/solicitacoes", title: "Solicitações", description: "Itens avulsos, com aprovação" }]
      : []),
    ...(showFormularios
      ? [{ href: "/formularios", title: "Formulários", description: "Registros personalizados" }]
      : []),
    ...(isGestorProfile(profile)
      ? [{ href: "/indicadores", title: "Indicadores", description: "Conclusão, ranking e evolução" }]
      : []),
    ...(isGestorProfile(profile)
      ? [
          {
            href: "/auditorias",
            title: pendingAuditCount > 0 ? `Auditorias (${pendingAuditCount})` : "Auditorias",
            description:
              pendingAuditCount > 0
                ? `${pendingAuditCount} em conjunto com você`
                : "Visitas técnicas às unidades",
          },
        ]
      : []),
    ...(isGestorProfile(profile)
      ? [{ href: "/gerenciar", title: "Gerenciar", description: "Usuários, unidades e modelos" }]
      : []),
  ];

  return (
    <>
      <aside className="app-nav">
        <Link href="/hoje" className="app-nav-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo pode vir de URL externa configurada por empresa */}
          <img src={orgLogoUrl} alt={orgName} width={28} height={28} />
          <span>{orgName}</span>
        </Link>

        {contexto && <div className="app-nav-contexto">{contexto}</div>}

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
                    {!!item.badge && (
                      <span
                        className="badge badge-brand"
                        style={{ marginLeft: 8 }}
                        aria-label={`${item.badge} pendente${item.badge > 1 ? "s" : ""}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <ThemeToggle className="app-nav-theme" />
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
          <Icone nome="hoje" />
          <span className="mobile-nav-label">Hoje</span>
        </Link>
        <Link
          href="/checklist"
          className={`mobile-nav-item${isActive("/checklist") ? " active" : ""}`}
        >
          <Icone nome="checklists" />
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
          <Icone nome="diario" />
          <span className="mobile-nav-label">Diário</span>
        </Link>
        <button type="button" className="mobile-nav-item" onClick={() => setMoreOpen(true)}>
          <Icone nome="mais" />
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
        <BottomSheet
          onClose={() => setMoreOpen(false)}
          header={
            <>
              <div className="sheet-user">
                <div className="sheet-user-avatar">{initials(userName)}</div>
                <div>
                  <div className="sheet-user-name">{userName}</div>
                  <div className="sheet-user-meta">{PROFILE_LABELS[profile] ?? profile} · {scope}</div>
                </div>
              </div>
              <div className="sheet-label">Tema</div>
              <ThemeSegmented />
              {contexto && (
                <>
                  <div className="sheet-label">Hoje</div>
                  <div className="app-nav-contexto">{contexto}</div>
                </>
              )}
            </>
          }
        >
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
