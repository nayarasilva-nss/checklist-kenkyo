import { getCurrentUser } from "@/lib/auth/dal";
import { getDayReport, getWeekReport } from "@/lib/data/reports";
import { todayISO } from "@/lib/data/checklists";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { DateFilter } from "./DateFilter";

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; unit?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { date: rawDate, unit: rawUnit } = await searchParams;
  const date = rawDate || todayISO();
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);

  const [dayReport, weekReport, units] = await Promise.all([
    getDayReport(date, unitId),
    getWeekReport(date, unitId),
    isGestor ? getUnits() : Promise.resolve([]),
  ]);

  return (
    <>
      <h2>Relatório de Atividades</h2>

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      <div className="report-section">
        <h3>Filtrar por Data</h3>
        <DateFilter date={date} unit={rawUnit} />
      </div>

      {isGestor && (
        <div className="report-section">
          <h3>Filtrar por Unidade</h3>
          <UnitFilter units={units} value={requestedUnitId} />
        </div>
      )}

      <div className="report-section">
        <h3>📅 Relatório do Dia</h3>
        {dayReport.length === 0 ? (
          <p className="empty-state">Nenhum checklist concluído neste dia</p>
        ) : (
          dayReport.map((row) => (
            <div className="report-item" key={row.name}>
              <span className="user-name">{row.name}</span>
              <span className="count">
                {row.count} checklist{row.count > 1 ? "s" : ""}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="report-section">
        <h3>📆 Relatório da Semana</h3>
        {weekReport.length === 0 ? (
          <p className="empty-state">
            Nenhum checklist concluído nesta semana
          </p>
        ) : (
          weekReport.map((row) => (
            <div className="report-item" key={row.name}>
              <span className="user-name">{row.name}</span>
              <span className="count">
                {row.count} checklist{row.count > 1 ? "s" : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
