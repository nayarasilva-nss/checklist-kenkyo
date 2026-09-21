import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGestor } from "@/lib/auth/dal";
import { getAudit } from "@/lib/data/audits";
import { AUDIT_STATUS_LABEL, classifyAudit, computeAuditScore } from "@/lib/audit-scoring";
import { ImprimirButton } from "../../../historico/imprimir/ImprimirButton";

export default async function AuditoriaImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireGestor();
  const { id } = await params;
  const audit = await getAudit(Number(id), user.organizationId!);
  if (!audit || audit.status !== "finalizada") notFound();

  const { percent, lostByGroup, counts } = computeAuditScore(audit.answers);
  const cls = classifyAudit(percent);
  const total = counts.conforme + counts.parcial + counts.nao_conforme || 1;
  const pc = (counts.conforme / total) * 100;
  const pp = (counts.parcial / total) * 100;
  const date = new Date(`${audit.visitDate}T00:00:00`).toLocaleDateString("pt-BR");
  const issues = audit.answers.filter((a) => a.status === "nao_conforme" || a.status === "parcial");
  const groups = [...new Set(issues.map((a) => a.groupName))];
  const orgName = user.organizationName ?? "Kenkyo";

  return (
    <div className="print-doc">
      <style>{`
        body { background: #fff; }
        .print-doc { max-width: 820px; margin: 0 auto; padding: 24px; color: #111; font-family: Arial, sans-serif; }
        .print-doc * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .box { border: 1px solid #ccc; margin-bottom: 12px; }
        .box > .h { background: #888; color: #fff; text-align: center; padding: 6px; }
        .box > .p { padding: 10px 12px; }
        .gh { background: #ddd; padding: 6px 12px; font-weight: 600; }
        .row { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #ccc; }
        .row > div { padding: 8px 12px; }
        .photos { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 12px; background: #f4f4f4; }
        .photos img { width: 30%; height: 150px; object-fit: cover; }
        @media print { .no-print { display: none !important; } .print-doc { padding: 0; } .row, .photos { break-inside: avoid; } }
      `}</style>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Link href={`/auditorias/${audit.id}`} className="btn-tertiary">← Voltar</Link>
        <ImprimirButton />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #ccc", paddingBottom: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.organizationLogoUrl ?? "/kenkyo-logo.png"} alt={orgName} height={48} />
        <strong style={{ fontSize: 20 }}>{orgName}</strong>
      </div>
      <h1 style={{ textAlign: "center", fontSize: 22, margin: "20px 0" }}>Avaliação de Visita Técnica</h1>

      <div className="box"><div className="p"><strong>Cliente:</strong> {orgName} - {audit.unitName}</div>
        <div className="p" style={{ borderTop: "1px solid #ccc" }}><strong>Data:</strong> {date}</div></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: 12 }}>
        <div style={{ background: "#ddd", textAlign: "center", padding: 6 }}>Nota: <strong>{percent}%</strong></div>
        <div style={{ background: cls.color, textAlign: "center", padding: 6 }}>Classificação: <strong>{cls.label}</strong></div>
      </div>

      <div className="box"><div className="p" style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 140, height: 140, borderRadius: "50%", background: `conic-gradient(#3366cc 0 ${pc}%, #f5b800 ${pc}% ${pc + pp}%, #dc3912 ${pc + pp}% 100%)` }} />
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div>🔵 {Math.round(pc)}% conformes ({counts.conforme})</div>
          <div>🟡 {Math.round(pp)}% parcialmente conformes ({counts.parcial})</div>
          <div>🔴 {Math.round(100 - pc - pp)}% não conformes ({counts.nao_conforme})</div>
        </div>
      </div></div>

      {lostByGroup.length > 0 && (
        <div className="box"><div className="h">Pontos perdidos por Grupo</div><div className="p">
          {lostByGroup.map((g) => (
            <div key={g.name} style={{ display: "grid", gridTemplateColumns: "40% 1fr", gap: 8, marginBottom: 6, fontSize: 13 }}>
              <span style={{ textAlign: "right" }}>{g.name}</span>
              <div style={{ background: "#e63946", color: "#fff", width: `${Math.max(g.lostPercent, 8)}%`, padding: "2px 6px", textAlign: "right" }}>{g.lostPercent}%</div>
            </div>
          ))}
        </div></div>
      )}

      {issues.length > 0 && (
        <div className="box"><div className="h">Apontamentos em Inconformidade</div>
          {groups.map((g) => (
            <div key={g}>
              <div className="gh">{g}</div>
              {issues.filter((a) => a.groupName === g).map((a) => (
                <div key={a.id}>
                  <div className="row"><div>{a.itemLabel}</div><div><strong>{AUDIT_STATUS_LABEL[a.status!]}.</strong> {a.note}</div></div>
                  {a.photoUrls.length > 0 && (
                    <div className="photos">
                      {a.photoUrls.map((u) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={u} src={u} alt="" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(audit.comments || audit.actionPlan) && (
        <div className="box"><div className="h">Outros Comentários</div>
          <div className="p" style={{ whiteSpace: "pre-wrap" }}>
            {audit.comments}
            {audit.actionPlan && <><br /><br /><strong>Plano de ação:</strong><br />{audit.actionPlan}</>}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", margin: "28px 0 40px", fontSize: 13 }}>{date}</div>
      <div style={{ display: "flex", gap: 40, justifyContent: "center", fontSize: 13 }}>
        <div style={{ borderTop: "1px solid #999", width: 240, paddingTop: 4 }}>{audit.auditorName}<br />Auditor</div>
        <div style={{ borderTop: "1px solid #999", width: 240, paddingTop: 4 }}>Nome:<br />Responsável da unidade</div>
      </div>
    </div>
  );
}
