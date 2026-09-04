import { getCurrentUser } from "@/lib/auth/dal";
import {
  getShiftLogsByScope,
  resolveShiftLogScope,
  getMyPendencias,
} from "@/lib/data/shift-logs";
import { resolvePendencia } from "@/lib/actions/shift-logs";
import { getUnits } from "@/lib/data/units";
import { SHIFT_STATUS } from "@/lib/shift-log-constants";
import { DiarioBordoForm } from "./DiarioBordoForm";
import { ShiftLogsBoard } from "./ShiftLogsBoard";

const STATUS_LABELS = Object.fromEntries(SHIFT_STATUS.map((s) => [s.value, s.label]));
const STATUS_DOT: Record<string, string> = {
  estavel: "var(--success)",
  sob_pressao: "var(--warning)",
  instavel: "var(--danger)",
};

export default async function DiarioDeBordoPage({
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

  const scope = resolveShiftLogScope(user, requestedUnitId);

  const [records, units] = await Promise.all([
    getShiftLogsByScope(scope),
    canViewAllUnits ? getUnits() : Promise.resolve([]),
  ]);

  if (isGestor || isRh) {
    return (
      <ShiftLogsBoard
        records={records}
        units={units}
        canViewAllUnits={canViewAllUnits}
        requestedUnitId={requestedUnitId}
        canDelete={isGestor}
      />
    );
  }

  const myPendencias = await getMyPendencias(user.id);
  const timeline = records.slice(0, 8);

  return (
    <>
      <h2>Diário de Bordo da Liderança</h2>

      {user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      <div className="hoje-layout">
        <div>
          <DiarioBordoForm />
        </div>

        <div className="hoje-column">
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Turnos anteriores
            </div>
            {timeline.length === 0 ? (
              <p className="empty-state">Nenhum diário de bordo registrado ainda</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {timeline.map((log) => (
                  <div key={log.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        marginTop: 5,
                        flexShrink: 0,
                        background: STATUS_DOT[log.statusTurno] ?? "var(--text-faint)",
                      }}
                    />
                    <div>
                      <div className="pendencia-item-title">
                        {new Date(`${log.date}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                        {STATUS_LABELS[log.statusTurno] ?? log.statusTurno}
                      </div>
                      <div className="pendencia-item-meta">{log.desvioDescricao}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Pendências que você abriu
            </div>
            {myPendencias.length === 0 ? (
              <p className="empty-state">Nenhuma pendência registrada</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myPendencias.map((p) => (
                  <div
                    key={p.id}
                    className="quick-action-row"
                    style={{
                      textDecoration: p.concluida ? "line-through" : "none",
                      color: p.concluida ? "var(--success-text)" : undefined,
                    }}
                  >
                    <span>{p.descricao}</span>
                    {p.concluida ? (
                      <span className="badge badge-success">feito</span>
                    ) : (
                      <form action={resolvePendencia}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="btn-tertiary">
                          Concluir
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
