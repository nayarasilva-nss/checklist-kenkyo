import { getCurrentUser } from "@/lib/auth/dal";
import { canSubmitFilleting, getFilletingRecords } from "@/lib/data/filleting";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { FiletagemForm } from "./FiletagemForm";

export default async function FiletagemPage({
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
    getFilletingRecords(unitId),
    isGestor ? getUnits() : Promise.resolve([]),
  ]);

  return (
    <>
      <h2>Filetagem de Pescado</h2>

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      {canSubmitFilleting(user) && (
        <div className="report-section">
          <FiletagemForm />
        </div>
      )}

      {isGestor && (
        <div className="report-section">
          <h3>Filtrar por Unidade</h3>
          <UnitFilter units={units} value={requestedUnitId} />
        </div>
      )}

      <div className="report-section">
        <h3>📉 Histórico de Perda por Filetagem</h3>
        {records.length === 0 ? (
          <p className="empty-state">Nenhum registro de filetagem ainda</p>
        ) : (
          records.map((record) => (
            <div className="report-item" key={record.id}>
              <div>
                <span className="user-name">
                  {record.fishType} — {record.unitName}
                </span>
                <div className="item-text">
                  {new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")} · lançado por {record.userName}
                </div>
                <div className="item-text">
                  Recebido {record.recebidoKg.toFixed(2)} kg · Perda{" "}
                  {record.perdaKg.toFixed(2)} kg
                </div>
              </div>
              <span className="count">{record.perdaPercent.toFixed(1)}% de perda</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
