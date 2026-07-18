import { getCurrentUser } from "@/lib/auth/dal";
import { getShiftLogsByScope, resolveShiftLogScope } from "@/lib/data/shift-logs";
import { deleteShiftLog } from "@/lib/actions/shift-logs";
import { getUnits } from "@/lib/data/units";
import { LEADER_SELF_ASSESSMENT, SHIFT_STATUS } from "@/lib/shift-log-constants";
import { UnitFilter } from "../UnitFilter";
import { DeleteButton } from "../gerenciar/DeleteButton";
import { DiarioBordoForm } from "./DiarioBordoForm";

const STATUS_LABELS = Object.fromEntries(SHIFT_STATUS.map((s) => [s.value, s.label]));
const ASSESSMENT_LABELS = Object.fromEntries(
  LEADER_SELF_ASSESSMENT.map((a) => [a.value, a.label]),
);

export default async function DiarioDeBordoPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { unit: rawUnit } = await searchParams;
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;

  const scope = resolveShiftLogScope(user, requestedUnitId);

  const [records, units] = await Promise.all([
    getShiftLogsByScope(scope),
    isGestor ? getUnits() : Promise.resolve([]),
  ]);

  return (
    <>
      <h2>Diário de Bordo da Liderança</h2>

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      <div className="report-section">
        <DiarioBordoForm />
      </div>

      {isGestor && (
        <div className="report-section">
          <h3>Filtrar por Unidade</h3>
          <UnitFilter units={units} value={requestedUnitId} />
        </div>
      )}

      <div className="report-section">
        <h3>📖 Registros do Turno</h3>
        {records.length === 0 ? (
          <p className="empty-state">Nenhum diário de bordo registrado ainda</p>
        ) : (
          records.map((record) => (
            <div className="report-item" key={record.id}>
              <div>
                <span className="user-name">
                  {STATUS_LABELS[record.statusTurno]} — {record.unitName} · {record.setor}
                </span>
                <div className="item-text">
                  {new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")} · líder:{" "}
                  {record.liderNome}
                </div>
                <div className="item-text">{record.statusJustificativa}</div>

                <div className="item-text">
                  <strong>Principal desvio:</strong> {record.desvioDescricao}
                </div>
                {record.desvioImpacto && (
                  <div className="item-text">Impacto: {record.desvioImpacto}</div>
                )}
                {record.desvioCausaRaiz && (
                  <div className="item-text">Causa raiz: {record.desvioCausaRaiz}</div>
                )}

                {record.acoesLideranca.length > 0 && (
                  <div className="item-text">
                    Ação de liderança: {record.acoesLideranca.join(", ")}
                  </div>
                )}
                {record.acaoLiderancaDescricao && (
                  <div className="item-text">{record.acaoLiderancaDescricao}</div>
                )}

                {record.outrasDecisoes && (
                  <div className="item-text">Outras decisões: {record.outrasDecisoes}</div>
                )}

                {record.gestaoEquipe.length > 0 && (
                  <div className="item-text">
                    Gestão da equipe: {record.gestaoEquipe.join(", ")}
                  </div>
                )}
                {record.gestaoEquipeDescricao && (
                  <div className="item-text">{record.gestaoEquipeDescricao}</div>
                )}

                {record.pendencias.length > 0 && (
                  <div className="item-text">
                    <strong>Pendências:</strong>
                    <ul>
                      {record.pendencias.map((p, i) => (
                        <li key={i}>
                          {p.descricao}
                          {p.responsavel ? ` — ${p.responsavel}` : ""}
                          {p.prazo
                            ? ` (prazo: ${new Date(`${p.prazo}T00:00:00`).toLocaleDateString("pt-BR")})`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="item-text">
                  Autoavaliação: {ASSESSMENT_LABELS[record.autoavaliacao]}
                </div>
                {record.autoavaliacaoMelhorias && (
                  <div className="item-text">
                    Poderia melhorar: {record.autoavaliacaoMelhorias}
                  </div>
                )}
              </div>
              {isGestor && (
                <div className="report-item-actions">
                  <DeleteButton
                    action={deleteShiftLog}
                    id={record.id}
                    confirmText="Remover este diário de bordo?"
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
