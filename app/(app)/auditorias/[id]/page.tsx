import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGestor } from "@/lib/auth/dal";
import { getAudit } from "@/lib/data/audits";
import { AUDIT_STATUS_LABEL, classifyAudit } from "@/lib/audit-scoring";
import { AuditForm } from "./AuditForm";

export default async function AuditoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const gestor = await requireGestor();
  const { id } = await params;
  const audit = await getAudit(Number(id), gestor.organizationId!);
  if (!audit) notFound();

  const date = new Date(`${audit.visitDate}T00:00:00`).toLocaleDateString("pt-BR");
  const header = (
    <div className="page-topbar">
      <h2 style={{ marginBottom: 0 }}>
        {audit.unitName} · {date}
      </h2>
      <Link href="/auditorias" className="btn-tertiary">← Voltar</Link>
    </div>
  );

  if (audit.status === "rascunho") {
    return (
      <>
        {header}
        {audit.coAuditorName && (
          <p className="items-count" style={{ marginBottom: 8 }}>
            Em conjunto: {audit.auditorName} & {audit.coAuditorName}
          </p>
        )}
        <AuditForm
          auditId={audit.id}
          organizationId={gestor.organizationId!}
          initialAnswers={audit.answers.map((a) => ({
            id: a.id,
            groupName: a.groupName,
            itemLabel: a.itemLabel,
            weight: a.weight,
            howToVerify: a.howToVerify,
            responsible: a.responsible,
            appliesTo: a.appliesTo,
            status: a.status,
            note: a.note,
            photoUrls: a.photoUrls,
          }))}
          initialComments={audit.comments}
          initialPlan={audit.actionPlan}
        />
      </>
    );
  }

  const cls = classifyAudit(audit.scorePercent ?? 0);
  const issues = audit.answers.filter((a) => a.status === "nao_conforme" || a.status === "parcial");
  return (
    <>
      {header}
      <div className="today-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 28, fontWeight: 800, color: cls.color }}>
          {audit.scorePercent}% · {cls.label}
        </p>
        <p className="items-count">
          {audit.coAuditorName
            ? `Auditores: ${audit.auditorName} & ${audit.coAuditorName}`
            : `Auditor: ${audit.auditorName}`}
        </p>
        <Link href={`/auditorias/${audit.id}/imprimir`} className="btn-pdf" style={{ display: "inline-block", marginTop: 12 }}>
          📥 Gerar PDF
        </Link>
      </div>
      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 12 }}>Apontamentos ({issues.length})</div>
        {issues.length === 0 && <p className="empty-state">Nenhuma inconformidade.</p>}
        {issues.map((a) => (
          <div key={a.id} className="list-item">
            <div className="info">
              <h4>{a.groupName} · {a.itemLabel}</h4>
              <p>{AUDIT_STATUS_LABEL[a.status!]}{a.note ? ` — ${a.note}` : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
