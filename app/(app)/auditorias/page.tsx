import Link from "next/link";
import { requireGestor } from "@/lib/auth/dal";
import { getUnits } from "@/lib/data/units";
import { getAuditPartners, getAudits, getAuditTemplate } from "@/lib/data/audits";
import { createAudit, deleteAudit } from "@/lib/actions/audits";
import { classifyAudit } from "@/lib/audit-scoring";
import { todayISO } from "@/lib/date-utils";
import { DeleteButton } from "../gerenciar/DeleteButton";

export default async function AuditoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const gestor = await requireGestor();
  const orgId = gestor.organizationId!;
  const { unit: rawUnit } = await searchParams;
  const unitFilter = rawUnit ? Number(rawUnit) : null;

  const [units, list, template, partners] = await Promise.all([
    getUnits(orgId),
    getAudits(orgId, unitFilter),
    getAuditTemplate(orgId),
    getAuditPartners(orgId, gestor.id),
  ]);
  const hasTemplate = template.some((g) => g.items.length > 0);

  // Evolução: variação da nota em relação à auditoria finalizada anterior da mesma unidade.
  const finalized = list.filter((a) => a.status === "finalizada" && a.scorePercent !== null);
  const previous = new Map<number, number | null>();
  for (const a of finalized) {
    const older = finalized.find(
      (o) => o.unitId === a.unitId && (o.visitDate < a.visitDate || (o.visitDate === a.visitDate && o.id < a.id)),
    );
    previous.set(a.id, older ? older.scorePercent : null);
  }

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Auditorias</h2>
      </div>

      <div className="today-card" style={{ marginBottom: 20 }}>
        <div className="today-card-title" style={{ marginBottom: 12 }}>Nova auditoria</div>
        {hasTemplate ? (
          <form action={createAudit} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="auditUnit">Unidade</label>
              <select id="auditUnit" name="unitId" required defaultValue="">
                <option value="" disabled>Selecione</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="auditDate">Data da visita</label>
              <input id="auditDate" type="date" name="visitDate" defaultValue={todayISO()} required />
            </div>
            {partners.length > 0 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="auditPartner">Avaliar em conjunto com</label>
                <select id="auditPartner" name="coAuditorId" defaultValue="">
                  <option value="">Ninguém (só eu)</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button className="btn-save" type="submit">Iniciar</button>
          </form>
        ) : (
          <p className="empty-state">
            Antes de auditar, monte o modelo em <Link href="/gerenciar?tab=auditoria">Gerenciar › Auditoria</Link>{" "}
            (grupos e perguntas).
          </p>
        )}
      </div>

      <div className="filter-pills">
        <Link href="/auditorias" className={`pill${!unitFilter ? " active" : ""}`}>Todas as unidades</Link>
        {units.map((u) => (
          <Link key={u.id} href={`/auditorias?unit=${u.id}`} className={`pill${unitFilter === u.id ? " active" : ""}`}>
            {u.name}
          </Link>
        ))}
      </div>

      <div className="today-card">
        {list.length === 0 && <p className="empty-state">Nenhuma auditoria ainda.</p>}
        {list.map((a) => {
          const cls = a.scorePercent !== null ? classifyAudit(a.scorePercent) : null;
          const prev = previous.get(a.id);
          const delta = a.scorePercent !== null && prev != null ? a.scorePercent - prev : null;
          return (
            <div className="list-item" key={a.id}>
              <div className="info">
                <h4>
                  <Link href={`/auditorias/${a.id}`}>
                    {a.unitName} · {new Date(`${a.visitDate}T00:00:00`).toLocaleDateString("pt-BR")}
                  </Link>
                </h4>
                <p>
                  {a.auditorName}
                  {a.coAuditorName && ` & ${a.coAuditorName}`} ·{" "}
                  {cls ? (
                    <strong style={{ color: cls.color }}>
                      {a.scorePercent}% {cls.label}
                    </strong>
                  ) : (
                    "Rascunho"
                  )}
                  {delta !== null && (
                    <span> · {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts vs. anterior</span>
                  )}
                </p>
              </div>
              <div className="list-item-actions">
                <DeleteButton action={deleteAudit} id={a.id} confirmText="Excluir essa auditoria?" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
