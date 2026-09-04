import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  canSubmitFilleting,
  getFilletingRecords,
  getFilletingMonthlySummary,
} from "@/lib/data/filleting";
import {
  canSubmitRestoIngesta,
  getRestoIngestaRecords,
  getRestoIngestaMonthlySummary,
} from "@/lib/data/resto-ingesta";
import { deleteFilletingRecord } from "@/lib/actions/filleting";
import { deleteRestoIngestaRecord } from "@/lib/actions/resto-ingesta";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { DeleteButton } from "../gerenciar/DeleteButton";
import { FiletagemForm } from "../filetagem/FiletagemForm";
import { RestoIngestaForm } from "../resto-ingesta/RestoIngestaForm";

function lossBadge(pct: number) {
  if (pct < 32) return "badge-success";
  if (pct <= 45) return "badge-warning";
  return "badge-danger";
}

export default async function PerdasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; unit?: string }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const { tab: rawTab, unit: rawUnit } = await searchParams;
  const tab = rawTab === "resto" ? "resto" : "filetagem";
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);

  const units = isGestor ? await getUnits() : [];

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Perdas</h2>
      </div>

      <div className="filter-pills">
        <Link
          href={`/perdas?tab=filetagem${requestedUnitId ? `&unit=${requestedUnitId}` : ""}`}
          className={`pill${tab === "filetagem" ? " active" : ""}`}
        >
          Filetagem de pescado
        </Link>
        <Link
          href={`/perdas?tab=resto${requestedUnitId ? `&unit=${requestedUnitId}` : ""}`}
          className={`pill${tab === "resto" ? " active" : ""}`}
        >
          Resto ingesta
        </Link>
      </div>

      {isGestor && (
        <div style={{ maxWidth: 280, marginBottom: 16 }}>
          <UnitFilter units={units} value={requestedUnitId} />
        </div>
      )}

      {!isGestor && user.unitId === null && (
        <p className="empty-state">
          Sua unidade ainda não foi definida. Peça a um Gestor para atribuir
          sua unidade no cadastro.
        </p>
      )}

      {tab === "filetagem" ? (
        <FiletagemTab user={user} unitId={unitId} />
      ) : (
        <RestoIngestaTab user={user} unitId={unitId} />
      )}
    </>
  );
}

async function FiletagemTab({
  user,
  unitId,
}: {
  user: { profile: string; unitId: number | null; jobFunctionName: string | null; name: string };
  unitId: number | null;
}) {
  const isGestor = user.profile === "gestor";
  const [records, summary] = await Promise.all([
    getFilletingRecords(unitId),
    getFilletingMonthlySummary(unitId),
  ]);

  const now = new Date();
  const monthRecords = records.filter((r) => {
    const d = new Date(`${r.date}T00:00:00`);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const kgPerdidosMes = monthRecords.reduce((sum, r) => sum + r.perdaKg, 0);
  const foraDoPadrao = monthRecords.filter((r) => r.perdaPercent > 45).length;

  return (
    <>
      {canSubmitFilleting(user) && (
        <div className="today-card" style={{ marginBottom: 20 }}>
          <FiletagemForm defaultResponsavel={user.name} />
        </div>
      )}

      <div className="summary-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="summary-card">
          <div className="summary-card-label">Perda média do mês</div>
          <div className="summary-card-value">
            {summary.avgLossPercent !== null ? `${summary.avgLossPercent.toFixed(1)}%` : "—"}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Kg perdidos no mês</div>
          <div className="summary-card-value">{kgPerdidosMes.toFixed(1)} kg</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Fora do padrão (&gt;45%)</div>
          <div className="summary-card-value">{foraDoPadrao}</div>
        </div>
      </div>

      <div className="data-table">
        <div
          className="data-table-head"
          style={{ gridTemplateColumns: "78px 1fr 110px 110px 130px 90px" }}
        >
          <span>Data</span>
          <span>Espécie · Unidade</span>
          <span>Recebido</span>
          <span>Perda</span>
          <span>Responsável</span>
          <span>% Perda</span>
        </div>
        {records.length === 0 ? (
          <div className="data-table-empty">Nenhum registro de filetagem ainda</div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="data-table-row"
              style={{ gridTemplateColumns: "78px 1fr 110px 110px 130px 90px", cursor: "default" }}
            >
              <span className="data-table-date">
                {new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              <span>
                {record.fishType} · {record.unitName}
              </span>
              <span>{record.recebidoKg.toFixed(2)} kg</span>
              <span>{record.perdaKg.toFixed(2)} kg</span>
              <span>{record.responsavel ?? record.userName}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${lossBadge(record.perdaPercent)}`}>
                  {record.perdaPercent.toFixed(1)}%
                </span>
                {isGestor && (
                  <DeleteButton
                    action={deleteFilletingRecord}
                    id={record.id}
                    confirmText={`Remover o registro de ${record.fishType} de ${new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")}?`}
                  />
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

async function RestoIngestaTab({
  user,
  unitId,
}: {
  user: { profile: string };
  unitId: number | null;
}) {
  const isGestor = user.profile === "gestor";
  const [records, summary] = await Promise.all([
    getRestoIngestaRecords(unitId),
    getRestoIngestaMonthlySummary(unitId),
  ]);

  return (
    <>
      {canSubmitRestoIngesta(user) && (
        <div className="today-card" style={{ marginBottom: 20 }}>
          <RestoIngestaForm />
        </div>
      )}

      <div className="summary-cards" style={{ gridTemplateColumns: "repeat(1, 1fr)" }}>
        <div className="summary-card">
          <div className="summary-card-label">Desperdício médio por pessoa (mês)</div>
          <div className="summary-card-value">
            {summary.avgWastePerPersonKg !== null
              ? `${summary.avgWastePerPersonKg.toFixed(3)} kg`
              : "—"}
          </div>
        </div>
      </div>

      <div className="data-table">
        <div
          className="data-table-head"
          style={{ gridTemplateColumns: "78px 1fr 130px 130px 130px" }}
        >
          <span>Data</span>
          <span>Unidade</span>
          <span>Experiências</span>
          <span>Desperdício</span>
          <span>Kg/pessoa</span>
        </div>
        {records.length === 0 ? (
          <div className="data-table-empty">Nenhum registro de resto ingesta ainda</div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="data-table-row"
              style={{ gridTemplateColumns: "78px 1fr 130px 130px 130px", cursor: "default" }}
            >
              <span className="data-table-date">
                {new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              <span>{record.unitName}</span>
              <span>{record.experienciasVendidas}</span>
              <span>{record.desperdicioKg.toFixed(2)} kg</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {record.desperdicioPorPessoaKg.toFixed(3)} kg
                {isGestor && (
                  <DeleteButton
                    action={deleteRestoIngestaRecord}
                    id={record.id}
                    confirmText={`Remover o registro de ${new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR")}?`}
                  />
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
