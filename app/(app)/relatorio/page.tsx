import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getDayReport, getPeriodReport } from "@/lib/data/reports";
import { todayISO } from "@/lib/data/checklists";
import { daysBeforeISO } from "@/lib/date-utils";
import { getUnits, getJobFunctions, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { JobFunctionFilter } from "../JobFunctionFilter";
import { DateFilter } from "../DateFilter";

const PERIODS = {
  "7": { label: "7 dias", days: 6 },
  "30": { label: "30 dias", days: 29 },
  mes: { label: "Mês", days: null },
} as const;
type PeriodKey = keyof typeof PERIODS;

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; unit?: string; funcao?: string; periodo?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { date: rawDate, unit: rawUnit, funcao: rawFuncao, periodo: rawPeriodo } =
    await searchParams;
  const date = rawDate || todayISO();
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);
  const jobFunctionId = rawFuncao ? Number(rawFuncao) : null;
  const periodo: PeriodKey = rawPeriodo && rawPeriodo in PERIODS ? (rawPeriodo as PeriodKey) : "7";

  const periodDef = PERIODS[periodo];
  const fromDate =
    periodDef.days !== null
      ? daysBeforeISO(date, periodDef.days)
      : `${date.slice(0, 7)}-01`;

  const [dayReport, periodReport, units, jobFunctions] = await Promise.all([
    getDayReport(date, unitId, jobFunctionId),
    getPeriodReport(fromDate, date, unitId, jobFunctionId),
    isGestor ? getUnits() : Promise.resolve([]),
    getJobFunctions(),
  ]);

  const periodParams = new URLSearchParams();
  if (rawUnit) periodParams.set("unit", rawUnit);
  if (rawFuncao) periodParams.set("funcao", rawFuncao);
  if (rawDate) periodParams.set("date", rawDate);

  return (
    <>
      <h2>Relatório de Atividades</h2>

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        <DateFilter date={date} unit={rawUnit} action="/relatorio" />
        {isGestor && <UnitFilter units={units} value={requestedUnitId} />}
        <JobFunctionFilter jobFunctions={jobFunctions} value={jobFunctionId} />
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
        <h3>📆 Relatório do Período</h3>
        <div className="filter-pills">
          {(Object.keys(PERIODS) as PeriodKey[]).map((key) => {
            const params = new URLSearchParams(periodParams);
            params.set("periodo", key);
            return (
              <Link
                key={key}
                href={`/relatorio?${params.toString()}`}
                className={`pill${periodo === key ? " active" : ""}`}
              >
                {PERIODS[key].label}
              </Link>
            );
          })}
        </div>
        {periodReport.length === 0 ? (
          <p className="empty-state">Nenhum checklist concluído nesse período</p>
        ) : (
          periodReport.map((row) => (
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
