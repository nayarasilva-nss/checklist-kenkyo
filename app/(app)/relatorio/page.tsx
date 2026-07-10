import { getCurrentUser } from "@/lib/auth/dal";
import { getDayReport, getWeekReport } from "@/lib/data/reports";
import { todayISO } from "@/lib/data/checklists";
import { DateFilter } from "./DateFilter";

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await getCurrentUser();
  const { date: rawDate } = await searchParams;
  const date = rawDate || todayISO();

  const [dayReport, weekReport] = await Promise.all([
    getDayReport(date),
    getWeekReport(date),
  ]);

  return (
    <>
      <h2>Relatório de Atividades</h2>

      <div className="report-section">
        <h3>Filtrar por Data</h3>
        <DateFilter date={date} />
      </div>

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
