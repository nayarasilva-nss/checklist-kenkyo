import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistsForUser } from "@/lib/data/checklists";
import { getDashboardStats } from "@/lib/data/dashboard";
import { getAnomaliesByScope } from "@/lib/data/anomalies";
import { getOpenPendenciasForUnit } from "@/lib/data/shift-logs";
import { resolvePendencia } from "@/lib/actions/shift-logs";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { getUnits } from "@/lib/data/units";
import { daysAgoISO, greeting, todayISO, todayShortLabel } from "@/lib/date-utils";

function checklistState(done: number, total: number): "concluido" | "andamento" | "aguardando" {
  if (total > 0 && done === total) return "concluido";
  if (done > 0) return "andamento";
  return "aguardando";
}

const STATE_LABEL = {
  concluido: "Concluído",
  andamento: "Em andamento",
  aguardando: "Aguardando",
} as const;

export default async function HojePage() {
  const user = await getCurrentUser();
  const viewer = {
    id: user.id,
    profile: user.profile,
    jobFunctionId: user.jobFunctionId,
  };

  const isGestor = user.profile === "gestor";
  const isRh = user.profile === "rh";
  const canWriteShiftLog = user.profile === "gerente" || user.profile === "lider";
  const canCreateAnomaly = !isRh;

  const [units, checklists] = await Promise.all([
    user.unitId ? getUnits() : Promise.resolve([]),
    isRh ? Promise.resolve([]) : getChecklistsForUser("daily", viewer),
  ]);
  const unitName = units.find((u) => u.id === user.unitId)?.name ?? null;

  const [stats, pendencias, recentAnomalies] = await Promise.all([
    getDashboardStats(isGestor ? null : (user.unitId ?? null)),
    user.unitId ? getOpenPendenciasForUnit(user.unitId) : Promise.resolve([]),
    user.unitId
      ? getAnomaliesByScope({ mode: "unit", unitId: user.unitId }, { sinceDate: daysAgoISO(7) })
      : Promise.resolve([]),
  ]);
  const recentAnomalyCount = recentAnomalies.length;

  const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
  const doneItems = checklists.reduce(
    (sum, c) => sum + c.items.filter((i) => i.status !== "pending").length,
    0,
  );
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const sortedChecklists = [...checklists].sort((a, b) => a.name.localeCompare(b.name));
  const myCompletedChecklists = checklists.filter(
    (c) => checklistState(c.items.filter((i) => i.status !== "pending").length, c.items.length) === "concluido",
  ).length;

  return (
    <>
      <div className="page-topbar">
        <div>
          <h2 style={{ marginBottom: 0 }}>
            {greeting()}, {user.name.split(" ")[0]}
          </h2>
          <div className="today-card-subtitle" style={{ marginTop: 4 }}>
            {[unitName, todayShortLabel()].filter(Boolean).join(" · ")}
          </div>
        </div>
        {canCreateAnomaly && (
          <Link href="/anomalias" className="btn-primary" style={{ display: "inline-block" }}>
            Registrar anomalia
          </Link>
        )}
      </div>

      <div className="hoje-layout">
        <div className="hoje-column">
          {isGestor ? (
            <div className="today-card">
              <div className="today-card-header">
                <div>
                  <div className="today-card-title">Painel geral</div>
                  <div className="today-card-subtitle">Todas as unidades, hoje</div>
                </div>
                <Link href="/dashboard" className="today-card-link">
                  Ver painel completo
                </Link>
              </div>
              <div className="summary-cards" style={{ marginBottom: 0 }}>
                <Link href="/dashboard" className="summary-card summary-card-clickable">
                  <div className="summary-card-label">Concluídos hoje</div>
                  <div className="summary-card-value">
                    {stats.completedToday}/{stats.totalChecklists}
                  </div>
                </Link>
                <Link href="/dashboard" className="summary-card summary-card-clickable">
                  <div className="summary-card-label">Em andamento</div>
                  <div className="summary-card-value">{stats.inProgress}</div>
                </Link>
                <Link href="/dashboard" className="summary-card summary-card-clickable">
                  <div className="summary-card-label">Conformidade</div>
                  <div className="summary-card-value">
                    {stats.complianceRate !== null ? `${stats.complianceRate}%` : "—"}
                  </div>
                </Link>
              </div>
            </div>
          ) : !isRh ? (
            <div className="today-card">
              <div className="today-card-header">
                <div>
                  <div className="today-card-title">Seu turno agora</div>
                  <div className="today-card-subtitle">
                    {checklists.length} checklist{checklists.length !== 1 ? "s" : ""} atribuído
                    {checklists.length !== 1 ? "s" : ""} à sua função
                  </div>
                </div>
                {totalItems > 0 && (
                  <div className="progress-ring" style={{ background: `conic-gradient(var(--kenkyo-red) 0turn ${overallPct / 100}turn, #262a31 ${overallPct / 100}turn 1turn)` }}>
                    <div className="progress-ring-inner">{overallPct}%</div>
                  </div>
                )}
              </div>

              {sortedChecklists.length === 0 ? (
                <p className="empty-state">
                  Nenhum checklist disponível para você ainda. Peça a um Gestor para criar um
                  modelo para a sua função.
                </p>
              ) : (
                <div className="today-checklist-list">
                  {sortedChecklists.map((c) => {
                    const done = c.items.filter((i) => i.status !== "pending").length;
                    const total = c.items.length;
                    const state = checklistState(done, total);
                    const requiresPhoto = c.items.filter((i) => i.requiresPhoto).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div key={c.id} className={`today-checklist-row ${state}`}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="today-checklist-name">{c.name}</div>
                          {state === "aguardando" ? (
                            <div className="today-checklist-meta">
                              {total} itens{requiresPhoto > 0 ? ` · ${requiresPhoto} exigem foto` : ""}
                            </div>
                          ) : (
                            <>
                              <div className="today-checklist-meta">
                                {done}/{total}
                              </div>
                              <div className="today-checklist-progress-bar">
                                <div
                                  className="today-checklist-progress-fill"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="today-checklist-actions">
                          <span className={`state-pill state-pill-${state}`}>
                            {STATE_LABEL[state]}
                          </span>
                          <Link
                            href={`/checklist/${c.id}?type=daily`}
                            className={state === "andamento" ? "btn-primary" : "btn-tertiary"}
                          >
                            {state === "aguardando" ? "Abrir" : state === "andamento" ? "Continuar" : "Ver"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {user.unitId && (
            <div className="today-card">
              <div className="today-card-header">
                <div>
                  <div className="today-card-title">Pendências herdadas</div>
                  <div className="today-card-subtitle">
                    Abertas no diário de bordo dos turnos anteriores
                  </div>
                </div>
                <Link href="/diario-de-bordo" className="today-card-link">
                  Ver diário
                </Link>
              </div>

              {pendencias.length === 0 ? (
                <p className="empty-state">Nenhuma pendência em aberto</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendencias.map((p) => {
                    const urgency = !p.prazo
                      ? ""
                      : p.prazo <= todayISO()
                        ? "urgent"
                        : "upcoming";
                    return (
                      <div key={p.id} className={`pendencia-item ${urgency}`}>
                        <div>
                          <div className="pendencia-item-title">{p.descricao}</div>
                          <div className="pendencia-item-meta">
                            {p.setor} ·{" "}
                            {new Date(`${p.shiftLogDate}T00:00:00`).toLocaleDateString("pt-BR")}
                            {p.responsavel ? ` · ${p.responsavel}` : ""}
                          </div>
                        </div>
                        <form action={resolvePendencia}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="btn-tertiary">
                            Concluir
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hoje-column">
          {(canCreateAnomaly || canSubmitRestoIngesta(user) || canSubmitFilleting(user)) && (
            <div className="today-card">
              <div className="today-card-title" style={{ marginBottom: 8 }}>
                Registrar agora
              </div>
              {canCreateAnomaly && (
                <Link href="/anomalias" className="quick-action-row">
                  Anomalia
                  <span className="quick-action-plus">+</span>
                </Link>
              )}
              {canSubmitRestoIngesta(user) && (
                <Link href="/perdas?tab=resto" className="quick-action-row">
                  Resto ingesta
                  <span className="quick-action-plus">+</span>
                </Link>
              )}
              {canSubmitFilleting(user) && (
                <Link href="/perdas?tab=filetagem" className="quick-action-row">
                  Filetagem de pescado
                  <span className="quick-action-plus">+</span>
                </Link>
              )}
            </div>
          )}

          {canWriteShiftLog && (
            <div className="closing-card">
              <div className="today-card-title" style={{ marginBottom: 8 }}>
                Fechamento do turno
              </div>
              <p>Registre o diário de bordo ao final do turno para manter a próxima liderança informada.</p>
              <Link href="/diario-de-bordo" className="btn-primary btn-primary-block">
                Escrever diário de bordo
              </Link>
            </div>
          )}

          {!isGestor && user.unitId && unitName && (
            <div className="today-card">
              <div className="today-card-title" style={{ marginBottom: 14 }}>
                {unitName} hoje
              </div>
              <div className="detail-panel-fields" style={{ gap: 12 }}>
                <div>
                  <div className="detail-panel-field-label">Conformidade (mês)</div>
                  <div className="detail-panel-field-value">
                    {stats.complianceRate !== null ? `${stats.complianceRate}%` : "—"}
                  </div>
                </div>
                <div>
                  <div className="detail-panel-field-label">Seus checklists concluídos hoje</div>
                  <div className="detail-panel-field-value">
                    {myCompletedChecklists}/{checklists.length}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <div className="detail-panel-field-label">Anomalias (7 dias)</div>
                  <div className="detail-panel-field-value">{recentAnomalyCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
