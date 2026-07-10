import { getCurrentUser } from "@/lib/auth/dal";
import { getHistoryEntries } from "@/lib/data/history-list";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";

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

  const [entries, units] = await Promise.all([
    getHistoryEntries(unitId),
    isGestor ? getUnits() : Promise.resolve([]),
  ]);

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
    </>
  );
}
