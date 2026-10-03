import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { isGestorProfile } from "@/lib/auth/profile";
import { getChecklistExportData } from "@/lib/data/checklists";
import { resolveUnitScope } from "@/lib/data/units";

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
  const evaluated = conformes + naoConformes;
  const quality = evaluated > 0 ? Math.round((conformes / evaluated) * 100) : null;
  const fill = total > 0 ? Math.round((answered.length / total) * 100) : 0;
  const done = total > 0 && answered.length >= total;

  const times = answered.map((i) => i.completedAt).filter((d): d is Date => !!d).map((d) => new Date(d).getTime());
  const start = times.length ? new Date(Math.min(...times)) : null;
  const end = times.length ? new Date(Math.max(...times)) : null;
  const duration = start && end ? formatDuration(end.getTime() - start.getTime()) : "—";

  const pdfParams = new URLSearchParams({ checklistTypeId: String(checklistTypeId), userId: String(userId), date });
  if (unitId !== null) pdfParams.set("unitId", String(unitId));
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");

  const info: [string, string][] = [
    ["Checklist", data.checklistType.name],
    ["Unidade", data.unitName ?? "—"],
    ["Responsável", data.userName],
    ["Data", dateLabel],
    ["Primeira resposta", hhmm(start)],
    ["Última resposta", hhmm(end)],
    ["Duração", duration],
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

      <p style={{ marginBottom: 12 }}>
        <span className={`status-pill ${done ? "completed" : "pending"}`}>{done ? "Concluída" : "Em andamento"}</span>
      </p>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">Qualidade</div>
          <div className="summary-card-value">{quality !== null ? `${quality}%` : "—"}</div>
          <div className="summary-card-meta">{conformes} conformes · {naoConformes} não conformes</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Preenchimento</div>
          <div className="summary-card-value">{fill}%</div>
          <div className="summary-card-meta">{answered.length} de {total} itens</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Duração</div>
          <div className="summary-card-value">{duration}</div>
          <div className="summary-card-meta">{hhmm(start)} → {hhmm(end)}</div>
        </div>
      </div>

      <div className="today-card" style={{ marginBottom: 16 }}>
        <div className="today-card-title" style={{ marginBottom: 10 }}>Informações</div>
        {info.map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)", minWidth: 150 }}>{k}:</span>
            <strong>{v}</strong>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            <span>Preenchimento</span>
            <span>{answered.length} de {total} itens</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ width: `${fill}%`, height: "100%", background: "var(--success-text)" }} />
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
