import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistsForUser, todayISO as checklistTodayISO } from "@/lib/data/checklists";
import {
  getDashboardStats,
  getRanking,
  getUsersWithoutChecklistToday,
} from "@/lib/data/dashboard";
import { getFilletingMonthlySummary } from "@/lib/data/filleting";
import { getRestoIngestaMonthlySummary } from "@/lib/data/resto-ingesta";
import { getOpenPendenciasForUnit } from "@/lib/data/shift-logs";
import { resolvePendencia } from "@/lib/actions/shift-logs";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { tiposPermitidos } from "@/lib/auth/requisicoes";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { greeting, todayISO, todayShortLabel } from "@/lib/date-utils";
import { UnitFilter } from "../UnitFilter";
import { DateFilter } from "../DateFilter";

const MEDALS = ["🥇", "🥈", "🥉"];

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

export default async function HojePage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string; date?: string }>;
}) {
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
  const canRequestRequisicao = tiposPermitidos(user).length > 0;

  const { unit: rawUnit, date: rawDate } = await searchParams;
  const painelDate = rawDate || checklistTodayISO();
  const isPainelToday = painelDate === checklistTodayISO();
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const painelUnitId = resolveUnitScope(user, requestedUnitId);

  const [units, checklists] = await Promise.all([
    user.unitId || isGestor || isRh ? getUnits() : Promise.resolve([]),
    isRh ? Promise.resolve([]) : getChecklistsForUser("daily", viewer),
  ]);
  const unitName = units.find((u) => u.id === user.unitId)?.name ?? null;

  const [pendencias, painelStats, ranking, filletingSummary, restoIngestaSummary, missingChecklist] =
    await Promise.all([
      user.unitId ? getOpenPendenciasForUnit(user.unitId) : Promise.resolve([]),
      getDashboardStats(painelUnitId, painelDate),
      getRanking(painelUnitId, painelDate),
      getFilletingMonthlySummary(painelUnitId, painelDate),
      getRestoIngestaMonthlySummary(painelUnitId, painelDate),
      getUsersWithoutChecklistToday(painelUnitId, painelDate),
    ]);
  const painelDateLabel = new Date(`${painelDate}T00:00:00`).toLocaleDateString("pt-BR");

  const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
  const doneItems = checklists.reduce(
    (sum, c) => sum + c.items.filter((i) => i.status !== "pending").length,
    0,
  );
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const sortedChecklists = [...checklists].sort((a, b) => a.name.localeCompare(b.name));

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
          {/* Gestor não precisa ter checklist atribuído — só aparece pra
              ele se de fato tiver algum (por opção/necessidade), sem o
              estado vazio que faz sentido pros outros perfis. */}
          {!isRh && (!isGestor || sortedChecklists.length > 0) ? (
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
          {(canCreateAnomaly ||
            canSubmitRestoIngesta(user) ||
            canSubmitFilleting(user) ||
            canRequestRequisicao) && (
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
              {canRequestRequisicao && (
                <Link href="/requisicoes" className="quick-action-row">
                  Requisição
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
        </div>
      </div>

      <h2 style={{ marginTop: 34, marginBottom: 16 }}>📊 Painel</h2>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <DateFilter date={painelDate} unit={rawUnit} action="/hoje" />
        {(isGestor || isRh) && <UnitFilter units={units} value={requestedUnitId} />}
      </div>

      {!isGestor && !isRh && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      {missingChecklist.length > 0 && (
        <div className="alert-banner">
          <strong>
            ⚠️ {missingChecklist.length}{" "}
            {missingChecklist.length === 1 ? "pessoa ainda não fez" : "pessoas ainda não fizeram"}{" "}
            nenhum checklist {isPainelToday ? "hoje" : `em ${painelDateLabel}`}:
          </strong>{" "}
          {missingChecklist
            .map((u) => (u.unitName ? `${u.name} (${u.unitName})` : u.name))
            .join(", ")}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h3>Checklists Totais</h3>
          <div className="value">{painelStats.totalChecklists}</div>
          <div className="subtitle">cadastrados</div>
        </div>
        <div className="card success">
          <h3>{isPainelToday ? "Concluídos Hoje" : "Concluídos"}</h3>
          <div className="value">{painelStats.completedToday}</div>
          <div className="subtitle">de {painelStats.totalChecklists}</div>
        </div>
        <div className="card warning">
          <h3>Em Andamento</h3>
          <div className="value">{painelStats.inProgress}</div>
          <div className="subtitle">pendentes</div>
        </div>
        <div className="card info">
          <h3>Taxa de Conformidade</h3>
          <div className="value">
            {painelStats.complianceRate === null ? "-" : `${painelStats.complianceRate}%`}
          </div>
          <div className="subtitle">{isPainelToday ? "mês atual" : `mês de ${painelDateLabel}`}</div>
        </div>
        <div className="card warning">
          <h3>🐟 Perda na Filetagem</h3>
          <div className="value">
            {filletingSummary.avgLossPercent === null
              ? "-"
              : `${filletingSummary.avgLossPercent.toFixed(1)}%`}
          </div>
          <div className="subtitle">média do {isPainelToday ? "mês atual" : `mês de ${painelDateLabel}`}</div>
        </div>
        <div className="card info">
          <h3>🍽️ Resto Ingesta</h3>
          <div className="value">
            {restoIngestaSummary.avgWastePerPersonKg === null
              ? "-"
              : `${restoIngestaSummary.avgWastePerPersonKg.toFixed(3)} kg`}
          </div>
          <div className="subtitle">
            desperdício médio por pessoa · {isPainelToday ? "mês atual" : `mês de ${painelDateLabel}`}
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 20 }}>
        🏆 Ranking de Colaboradores ({isPainelToday ? "semana atual" : `semana de ${painelDateLabel}`})
      </h2>
      {ranking.length === 0 ? (
        <p className="empty-state">Nenhum checklist concluído ainda</p>
      ) : (
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Colaborador</th>
              <th>Unidade</th>
              <th>Checklists Completos</th>
              <th>Taxa de Conformidade</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, idx) => (
              <tr key={row.name}>
                <td>
                  {MEDALS[idx] ?? "•"} {idx + 1}º
                </td>
                <td>{row.name}</td>
                <td>{row.unitName ?? "-"}</td>
                <td>{row.completions}</td>
                <td>{row.complianceRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
