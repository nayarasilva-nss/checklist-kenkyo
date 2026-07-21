import { getCurrentUser } from "@/lib/auth/dal";
import { getHistoryEntries } from "@/lib/data/history-list";
import {
  getChecklistHistoryItems,
  getChecklistHistorySummary,
} from "@/lib/data/checklist-history";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { ChecklistHistoryRow } from "./ChecklistHistoryRow";

const STATUS_LABELS = { completed: "Concluído", pending: "Pendente" } as const;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { unit: rawUnit } = await searchParams;
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);

  const [entries, checklistSummary, units] = await Promise.all([
    getHistoryEntries(unitId),
    getChecklistHistorySummary(unitId),
    isGestor ? getUnits() : Promise.resolve([]),
  ]);

  const itemsByCombo = await getChecklistHistoryItems(
    checklistSummary.map((s) => ({
      checklistTypeId: s.checklistTypeId,
      userId: s.userId,
      date: s.date,
    })),
  );

  return (
    <>
      <h2>Histórico de Atividades</h2>

      {isGestor && <UnitFilter units={units} value={requestedUnitId} />}

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      <div className="report-section">
        <h3>📋 Checklists</h3>
        {checklistSummary.length === 0 ? (
          <p className="empty-state">Nenhum checklist registrado ainda</p>
        ) : (
          checklistSummary.map((s) => (
            <ChecklistHistoryRow
              key={`${s.checklistTypeId}-${s.userId}-${s.date}`}
              checklistName={s.checklistName}
              userName={s.userName}
              unitName={s.unitName}
              date={s.date}
              completedItems={s.completedItems}
              totalItems={s.totalItems}
              items={itemsByCombo.get(`${s.checklistTypeId}-${s.userId}-${s.date}`) ?? []}
            />
          ))
        )}
      </div>

      <div className="report-section">
        <h3>🗒️ Outras Atividades</h3>
        {entries.length === 0 ? (
          <p className="empty-state">Nenhuma atividade registrada</p>
        ) : (
          entries.map((entry) => (
            <div className="history-item" key={entry.id}>
              <div className="date">
                {entry.createdAt.toLocaleString("pt-BR")}
              </div>
              <div className="title">
                {entry.userName} — {entry.action}
              </div>
              <span className={`status-pill ${entry.status}`}>
                {STATUS_LABELS[entry.status]}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
