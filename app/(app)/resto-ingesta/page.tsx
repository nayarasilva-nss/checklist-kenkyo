import { getCurrentUser } from "@/lib/auth/dal";
import {
  canSubmitRestoIngesta,
  getRestoIngestaRecords,
} from "@/lib/data/resto-ingesta";
import { deleteRestoIngestaRecord } from "@/lib/actions/resto-ingesta";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { DeleteButton } from "../gerenciar/DeleteButton";
import { RestoIngestaForm } from "./RestoIngestaForm";

export default async function RestoIngestaPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { unit: rawUnit } = await searchParams;
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);

  const [records, units] = await Promise.all([
    getRestoIngestaRecords(unitId),
    isGestor ? getUnits() : Promise.resolve([]),
  ]);

  return (
    <>
      <h2>Resto Ingesta</h2>

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      {canSubmitRestoIngesta(user) && (
        <div className="report-section">
          <RestoIngestaForm />
        </div>
      )}

      {isGestor && (
        <div className="report-section">
          <h3>Filtrar por Unidade</h3>
          <UnitFilter units={units} value={requestedUnitId} />
        </div>
      )}

      <div className="report-section">
        <h3>🍽️ Histórico de Resto Ingesta</h3>
        {records.length === 0 ? (
          <p className="empty-state">Nenhum registro de resto ingesta ainda</p>
        ) : (
          records.map((record) => (
            <div className="report-item" key={record.id}>
              <div>
                <span className="user-name">{record.unitName}</span>
                <div className="item-text">
                  {new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")} · lançado por {record.userName}
                </div>
                <div className="item-text">
                  {record.experienciasVendidas} experiências · {record.desperdicioKg.toFixed(2)} kg de desperdício
                </div>
              </div>
              <div className="report-item-actions">
                <span className="count">
                  {record.desperdicioPorPessoaKg.toFixed(3)} kg/pessoa
                </span>
                {isGestor && (
                  <DeleteButton
                    action={deleteRestoIngestaRecord}
                    id={record.id}
                    confirmText={`Remover o registro de ${new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")}?`}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
