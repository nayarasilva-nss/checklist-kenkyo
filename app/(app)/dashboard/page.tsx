import { getCurrentUser } from "@/lib/auth/dal";
import { getDashboardStats, getRanking, getUsersWithoutChecklistToday } from "@/lib/data/dashboard";
import { getFilletingMonthlySummary } from "@/lib/data/filleting";
import { getRestoIngestaMonthlySummary } from "@/lib/data/resto-ingesta";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { todayISO } from "@/lib/data/checklists";
import { UnitFilter } from "../UnitFilter";
import { DateFilter } from "../DateFilter";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { unit: rawUnit, date: rawDate } = await searchParams;
  const date = rawDate || todayISO();
  const isToday = date === todayISO();
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);

  const [stats, ranking, units, filletingSummary, restoIngestaSummary, missingChecklist] =
    await Promise.all([
      getDashboardStats(unitId, date),
      getRanking(unitId, date),
      isGestor ? getUnits() : Promise.resolve([]),
      getFilletingMonthlySummary(unitId, date),
      getRestoIngestaMonthlySummary(unitId, date),
      getUsersWithoutChecklistToday(unitId, date),
    ]);

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");

  return (
    <>
      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <DateFilter date={date} unit={rawUnit} action="/dashboard" />
        {isGestor && <UnitFilter units={units} value={requestedUnitId} />}
      </div>

      {!isGestor && user.unitId === null && (
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
            nenhum checklist {isToday ? "hoje" : `em ${dateLabel}`}:
          </strong>{" "}
          {missingChecklist
            .map((u) => (u.unitName ? `${u.name} (${u.unitName})` : u.name))
            .join(", ")}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h3>Checklists Totais</h3>
          <div className="value">{stats.totalChecklists}</div>
          <div className="subtitle">cadastrados</div>
        </div>
        <div className="card success">
          <h3>{isToday ? "Concluídos Hoje" : "Concluídos"}</h3>
          <div className="value">{stats.completedToday}</div>
          <div className="subtitle">de {stats.totalChecklists}</div>
        </div>
        <div className="card warning">
          <h3>Em Andamento</h3>
          <div className="value">{stats.inProgress}</div>
          <div className="subtitle">pendentes</div>
        </div>
        <div className="card info">
          <h3>Taxa de Conformidade</h3>
          <div className="value">
            {stats.complianceRate === null ? "-" : `${stats.complianceRate}%`}
          </div>
          <div className="subtitle">{isToday ? "mês atual" : `mês de ${dateLabel}`}</div>
        </div>
        <div className="card warning">
          <h3>🐟 Perda na Filetagem</h3>
          <div className="value">
            {filletingSummary.avgLossPercent === null
              ? "-"
              : `${filletingSummary.avgLossPercent.toFixed(1)}%`}
          </div>
          <div className="subtitle">média do {isToday ? "mês atual" : `mês de ${dateLabel}`}</div>
        </div>
        <div className="card info">
          <h3>🍽️ Resto Ingesta</h3>
          <div className="value">
            {restoIngestaSummary.avgWastePerPersonKg === null
              ? "-"
              : `${restoIngestaSummary.avgWastePerPersonKg.toFixed(3)} kg`}
          </div>
          <div className="subtitle">
            desperdício médio por pessoa · {isToday ? "mês atual" : `mês de ${dateLabel}`}
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 20 }}>
        🏆 Ranking de Colaboradores ({isToday ? "semana atual" : `semana de ${dateLabel}`})
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
