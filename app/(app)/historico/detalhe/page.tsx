import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { isGestorProfile } from "@/lib/auth/profile";
import { getChecklistExportData } from "@/lib/data/checklists";
import { resolveUnitScope } from "@/lib/data/units";
import { effortScore, punctualityScore, qualityScore } from "@/lib/checklist-scoring";

const STATUS_LABEL: Record<string, string> = {
  conforme: "Conforme",
  "nao-conforme": "Não conforme",
  "nao-se-aplica": "Não se aplica",
  pending: "Pendente",
};
const STATUS_COLOR: Record<string, string> = {
  conforme: "var(--success-text)",
  "nao-conforme": "var(--danger-text)",
  "nao-se-aplica": "var(--text-muted)",
  pending: "var(--warning-text)",
};

const toneOf = (v: number | null) => (v === null ? "" : v >= 90 ? "good" : v >= 75 ? "warn" : "bad");

const hhmm = (d: Date | null) =>
  d ? new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "—";

function formatDuration(ms: number) {
  const min = Math.round(ms / 60000);
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default async function DetalheRespostaPage({
  searchParams,
}: {
  searchParams: Promise<{ checklistTypeId?: string; userId?: string; date?: string; unitId?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const checklistTypeId = Number(sp.checklistTypeId);
  const userId = Number(sp.userId);
  const date = sp.date;
  const unitId = sp.unitId ? Number(sp.unitId) : null;
  if (!checklistTypeId || !userId || !date) notFound();

  const allowedUnitId = resolveUnitScope(user, unitId);
  if (!isGestorProfile(user.profile) && allowedUnitId !== unitId) redirect("/historico");

  const data = await getChecklistExportData(checklistTypeId, userId, date, unitId, user.organizationId!);
  if (!data) notFound();

  const total = data.items.length;
  const answered = data.items.filter((i) => i.status !== "pending");
  const conformes = data.items.filter((i) => i.status === "conforme").length;
  const naoConformes = data.items.filter((i) => i.status === "nao-conforme").length;
  const quality = qualityScore(data.items);
  const effort = effortScore(data.items);
  const punctuality = punctualityScore(data.items, data.checklistType.deadlineTime);
  const overall = (() => {
    const v = [punctuality, effort, quality].filter((x): x is number => x !== null);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  })();
  const fill = total > 0 ? Math.round((answered.length / total) * 100) : 0;
  const done = total > 0 && answered.length >= total;

  const times = answered.map((i) => i.completedAt).filter((d): d is Date => !!d).map((d) => new Date(d).getTime());
  const start = times.length ? new Date(Math.min(...times)) : null;
  const end = times.length ? new Date(Math.max(...times)) : null;
  const duration = start && end ? formatDuration(end.getTime() - start.getTime()) : "—";

  const pdfParams = new URLSearchParams({ checklistTypeId: String(checklistTypeId), userId: String(userId), date });
  if (unitId !== null) pdfParams.set("unitId", String(unitId));
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");

  const info: [string, string, string][] = [
    ["📋", "Checklist", data.checklistType.name],
    ["🏢", "Unidade", data.unitName ?? "—"],
    ["👤", "Responsável", data.userName],
    ["📅", "Data", dateLabel],
    ["▶", "Primeira resposta", hhmm(start)],
    ["■", "Última resposta", hhmm(end)],
    ["⏱", "Duração", duration],
  ];

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Detalhe da resposta</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/historico" className="btn-tertiary">← Voltar</Link>
          <a className="btn-pdf" href={`/api/historico/pdf?${pdfParams.toString()}`} target="_blank" rel="noopener noreferrer">📥 Exportar PDF</a>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <span className={`tone-pill ${done ? "good" : "warn"}`}>{done ? "✓ Concluída" : "◔ Em andamento"}</span>
        {overall !== null && <span className={`tone-pill ${toneOf(overall)}`}>★ {overall}%</span>}
      </div>

      <div className="summary-cards cols-3">
        {[
          ["Pontualidade", punctuality, data.checklistType.deadlineTime ? `Limite ${data.checklistType.deadlineTime} · concluído ${hhmm(end)}` : "Sem horário-limite definido"],
          ["Esforço", effort, "Respondido com justificativa e foto quando exigidas"],
          ["Qualidade", quality, `${conformes} conformes · ${naoConformes} não conformes`],
        ].map(([label, value, meta]) => (
          <div key={label as string} className={`tone-card ${toneOf(value as number | null)}`}>
            <div className="tone-label">{label}</div>
            <div className="tone-value">{value !== null ? `${value}%` : "—"}</div>
            <div className="tone-meta">{meta}</div>
          </div>
        ))}
      </div>

      <div className="today-card" style={{ marginBottom: 16 }}>
        <div className="today-card-title" style={{ marginBottom: 10 }}>Informações</div>
        {info.map(([ico, k, v]) => (
          <div key={k} className="info-row">
            <span className="ico">{ico}</span>
            <span className="k">{k}:</span>
            <strong>{v}</strong>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            <span>Preenchimento</span>
            <span>{answered.length} de {total} itens</span>
          </div>
          <div className="tone-card good" style={{ padding: 0, border: "none", background: "none", boxShadow: "none" }}>
            <div className="tone-bar" style={{ marginTop: 0, height: 8 }}><i style={{ width: `${fill}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 10 }}>Respostas ({total} itens)</div>
        {data.items.map((item, i) => (
          <div key={i} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>{item.label}</strong>
              <span style={{ fontWeight: 700, fontSize: 12, color: STATUS_COLOR[item.status] }}>
                {STATUS_LABEL[item.status] ?? item.status} · {hhmm(item.completedAt)}
              </span>
            </div>
            {item.justification && <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>{item.justification}</p>}
            {item.photoUrl && (
              <a href={item.photoUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- foto de evidência de URL externa */}
                <img src={item.photoUrl} alt="Foto de evidência" width={160} height={120} style={{ objectFit: "cover", borderRadius: 8, marginTop: 8 }} />
              </a>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
