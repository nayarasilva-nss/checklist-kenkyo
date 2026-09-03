import { getCurrentUser } from "@/lib/auth/dal";
import { getAnomaliesByScope, resolveAnomalyScope } from "@/lib/data/anomalies";
import { deleteAnomaly } from "@/lib/actions/anomalies";
import { getUnits } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { DeleteButton } from "../gerenciar/DeleteButton";
import { AnomaliaForm } from "./AnomaliaForm";

export default async function AnomaliasPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const isRh = user.profile === "rh";
  const canViewAllUnits = isGestor || isRh;
  const { unit: rawUnit } = await searchParams;
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;

  const scope = resolveAnomalyScope(user, requestedUnitId);

  const [records, units] = await Promise.all([
    getAnomaliesByScope(scope),
    canViewAllUnits ? getUnits() : Promise.resolve([]),
  ]);

  return (
    <>
      <h2>Relatório de Anomalias</h2>

      {!isGestor && !isRh && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      {!isRh && (
        <div className="report-section">
          <AnomaliaForm defaultRelator={user.name} />
        </div>
      )}

      {canViewAllUnits && (
        <div className="report-section">
          <h3>Filtrar por Unidade</h3>
          <UnitFilter units={units} value={requestedUnitId} />
        </div>
      )}

      <div className="report-section">
        <h3>⚠️ Anomalias {scope.mode === "own" ? "Reportadas por Você" : "Reportadas"}</h3>
        <a
          className="btn-pdf"
          href={`/api/anomalias/export${requestedUnitId ? `?unit=${requestedUnitId}` : ""}`}
        >
          📥 Baixar Excel
        </a>
        {records.length === 0 ? (
          <p className="empty-state">Nenhuma anomalia reportada ainda</p>
        ) : (
          records.map((record) => (
            <div className="report-item" key={record.id}>
              <div>
                <span className="user-name">
                  {record.tipos.join(", ")} — {record.unitName}
                  {record.sourceChecklistCompletionId && (
                    <span className="items-count"> · 🤖 gerada pelo checklist</span>
                  )}
                </span>
                <div className="item-text">
                  {new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")} · relatado por {record.relator}
                </div>
                <div className="item-text">Setores: {record.setores.join(", ")}</div>
                <div className="item-text">Colaboradores: {record.colaboradoresEnvolvidos}</div>
                <div className="item-text">{record.oQueAconteceu}</div>
                <div className="item-text">Causa percebida: {record.causaPercebida}</div>
                {record.consequenciaImediata && (
                  <div className="item-text">Consequência: {record.consequenciaImediata}</div>
                )}
                {record.acaoTomada && (
                  <div className="item-text">Ação tomada: {record.acaoTomada}</div>
                )}
                {record.sugestaoTratativa && (
                  <div className="item-text">Sugestão: {record.sugestaoTratativa}</div>
                )}
              </div>
              {isGestor && (
                <div className="report-item-actions">
                  <DeleteButton
                    action={deleteAnomaly}
                    id={record.id}
                    confirmText="Remover este registro de anomalia?"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
