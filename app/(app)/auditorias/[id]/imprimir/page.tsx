import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGestor } from "@/lib/auth/dal";
import { getAudit } from "@/lib/data/audits";
import { AUDIT_STATUS_LABEL, WEIGHT_LABEL, classifyAudit, computeAuditScore } from "@/lib/audit-scoring";
import { resolveBrandColors } from "@/lib/branding";
import { ImprimirButton } from "../../../historico/imprimir/ImprimirButton";

export default async function AuditoriaImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireGestor();
  const { id } = await params;
  const audit = await getAudit(Number(id), user.organizationId!);
  if (!audit || audit.status !== "finalizada") notFound();

  const { percent, groupScores, counts } = computeAuditScore(audit.answers);
  const cls = classifyAudit(percent);
  const brand = resolveBrandColors(user.organizationPrimaryColor).red;
  const applicable = counts.conforme + counts.parcial + counts.nao_conforme;
  const naCount = audit.answers.filter((a) => a.status === "nao_aplica").length;
  const seg = (n: number) => (applicable ? (n / applicable) * 100 : 0);
  const date = new Date(`${audit.visitDate}T00:00:00`).toLocaleDateString("pt-BR");
  const issues = audit.answers
    .filter((a) => a.status === "nao_conforme" || a.status === "parcial")
    .sort((a, b) => b.weight - a.weight || (a.status === "nao_conforme" ? -1 : 1));
  const criticalOpen = issues.filter((a) => a.weight === 3 && a.status === "nao_conforme").length;
  const orgName = user.organizationName ?? "Kenkyo";

  return (
    <div className="print-doc">
      <style>{`
        body { background: #ffffff; }
        .print-doc { background:#fff; min-height:100vh; max-width:760px; margin:0 auto; padding:32px 24px 60px; color:#16140f; font-family:Arial,Helvetica,sans-serif; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
        .print-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
        .print-head { display:flex; align-items:center; gap:16px; border-bottom:3px solid ${brand}; padding-bottom:18px; margin-bottom:24px; }
        .print-head h1 { font-size:20px; margin:0 0 4px; }
        .print-head .sub { font-size:13px; color:#65635a; }
        .print-badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:3px 10px; border-radius:6px; margin-top:6px; color:#fff; }
        .print-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px 28px; margin-bottom:22px; font-size:13.5px; }
        .print-grid .label { font-size:10.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#a19f92; margin-bottom:2px; }
        h2.sec { font-size:13px; letter-spacing:.05em; text-transform:uppercase; margin:26px 0 10px; padding-left:10px; border-left:4px solid ${brand}; }
        .score { display:flex; gap:20px; align-items:stretch; margin-bottom:22px; }
        .score-main { flex:0 0 190px; border:1px solid #e3e1da; border-radius:10px; padding:16px; text-align:center; }
        .score-main .n { font-size:46px; font-weight:800; line-height:1; }
        .score-side { flex:1; border:1px solid #e3e1da; border-radius:10px; padding:16px; font-size:13px; }
        .stack { display:flex; height:14px; border-radius:7px; overflow:hidden; background:#e3e1da; margin:8px 0 12px; }
        .legend { display:flex; gap:16px; flex-wrap:wrap; font-size:12px; color:#3d3b35; }
        .dot { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:5px; }
        table.print-table { width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:8px; }
        table.print-table th, table.print-table td { border:1px solid #e3e1da; padding:8px 10px; text-align:left; vertical-align:top; }
        table.print-table th { background:#16140f; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:.03em; }
        tr { break-inside: avoid; }
        .bar { height:9px; border-radius:5px; background:#e3e1da; overflow:hidden; min-width:90px; }
        .bar > i { display:block; height:100%; }
        .tag { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; }
        .photos { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
        .photos img { width:31%; height:120px; object-fit:cover; border-radius:6px; border:1px solid #e3e1da; }
        .text-box { border:1px solid #e3e1da; border-radius:8px; padding:12px 14px; font-size:13px; line-height:1.55; white-space:pre-wrap; }
        .sign { display:flex; gap:40px; justify-content:center; margin-top:56px; font-size:12px; color:#3d3b35; }
        .sign > div { width:230px; border-top:1px solid #16140f; padding-top:5px; text-align:center; }
        .print-footer { margin-top:34px; font-size:11px; color:#a19f92; text-align:center; }
        @page { size:A4; margin:16mm 14mm; }
        @media print { .no-print { display:none !important; } .print-doc { padding:0; max-width:none; } }
      `}</style>

      <div className="print-toolbar no-print">
        <Link href={`/auditorias/${audit.id}`} className="btn-tertiary">← Voltar</Link>
        <ImprimirButton />
      </div>

      <div className="print-head">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo pode vir de URL externa configurada por empresa */}
        <img src={user.organizationLogoUrl ?? "/kenkyo-logo.png"} alt={orgName} width={52} height={52} />
        <div>
          <h1>Auditoria de Unidade</h1>
          <div className="sub">{orgName} · {audit.unitName}</div>
          <span className="print-badge" style={{ background: cls.color, color: cls.label === "Bom" ? "#16140f" : "#fff" }}>
            {audit.scorePercent ?? percent}% · {cls.label}
          </span>
        </div>
      </div>

      <div className="print-grid">
        <div><div className="label">Unidade</div>{audit.unitName}</div>
        <div><div className="label">Data da visita</div>{date}</div>
        <div><div className="label">Auditor</div>{audit.auditorName}</div>
      </div>

      <div className="score">
        <div className="score-main">
          <div className="label" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#a19f92" }}>Nota geral</div>
          <div className="n" style={{ color: cls.color === "#f5b800" ? "#b58900" : cls.color, marginTop: 6 }}>{percent}%</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>{cls.label}</div>
        </div>
        <div className="score-side">
          <strong>{applicable} critérios avaliados</strong>{naCount > 0 && ` · ${naCount} não se aplicam`}
          <div className="stack">
            <i style={{ width: `${seg(counts.conforme)}%`, background: "#16a34a" }} />
            <i style={{ width: `${seg(counts.parcial)}%`, background: "#f5b800" }} />
            <i style={{ width: `${seg(counts.nao_conforme)}%`, background: "#e63946" }} />
          </div>
          <div className="legend">
            <span><i className="dot" style={{ background: "#16a34a" }} />Conformes {counts.conforme}</span>
            <span><i className="dot" style={{ background: "#f5b800" }} />Parciais {counts.parcial}</span>
            <span><i className="dot" style={{ background: "#e63946" }} />Não conformes {counts.nao_conforme}</span>
          </div>
          {criticalOpen > 0 && (
            <p style={{ margin: "12px 0 0", color: "#b3261e", fontWeight: 700 }}>
              ⚠ {criticalOpen} {criticalOpen === 1 ? "critério crítico não conforme" : "critérios críticos não conformes"}
            </p>
          )}
        </div>
      </div>

      <h2 className="sec">Nota por grupo</h2>
      <table className="print-table">
        <thead><tr><th>Grupo</th><th style={{ width: 70 }}>Nota</th><th style={{ width: 160 }}>Desempenho</th></tr></thead>
        <tbody>
          {groupScores.map((g) => {
            const c = classifyAudit(g.percent);
            return (
              <tr key={g.name}>
                <td>{g.name}</td>
                <td><strong>{g.percent}%</strong></td>
                <td><div className="bar"><i style={{ width: `${g.percent}%`, background: c.color }} /></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="legend" style={{ marginBottom: 6 }}>
        <span>Excelente ≥ 90%</span><span>Bom 75–89%</span><span>Regular 60–74%</span><span>Inadequado &lt; 60%</span>
      </div>

      <h2 className="sec">Apontamentos ({issues.length})</h2>
      {issues.length === 0 ? (
        <p style={{ fontSize: 13 }}>Nenhuma inconformidade registrada nesta visita.</p>
      ) : (
        <table className="print-table">
          <thead><tr><th>Critério</th><th style={{ width: 70 }}>Peso</th><th style={{ width: 100 }}>Situação</th><th>Observação</th></tr></thead>
          <tbody>
            {issues.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="tag" style={{ color: "#a19f92", display: "block" }}>{a.groupName}</span>
                  {a.itemLabel}
                  {a.responsible && <span style={{ display: "block", color: "#65635a", fontSize: 11 }}>Resp.: {a.responsible}</span>}
                </td>
                <td>{WEIGHT_LABEL[a.weight]}</td>
                <td><span className="tag" style={{ color: a.status === "nao_conforme" ? "#b3261e" : "#8a6d00" }}>{AUDIT_STATUS_LABEL[a.status!]}</span></td>
                <td>
                  {a.note || "—"}
                  {a.photoUrls.length > 0 && (
                    <div className="photos">
                      {a.photoUrls.map((u) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={u} src={u} alt="" />
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {audit.comments && (<><h2 className="sec">Comentários do auditor</h2><div className="text-box">{audit.comments}</div></>)}
      {audit.actionPlan && (<><h2 className="sec">Plano de ação</h2><div className="text-box">{audit.actionPlan}</div></>)}

      <div className="sign">
        <div>{audit.auditorName}<br />Auditor</div>
        <div>Responsável da unidade<br />Nome e assinatura</div>
      </div>

      <div className="print-footer">
        Documento gerado pelo sistema {orgName} em{" "}
        {new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
