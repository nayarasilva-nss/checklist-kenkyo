import { requireGestor } from "@/lib/auth/dal";
import { getUnits } from "@/lib/data/units";
import { getPainelGestor, type DayPoint } from "@/lib/data/painel";
import { checklistDayISO, daysBeforeISO } from "@/lib/date-utils";

const GREEN = "#16a34a";
const YELLOW = "#f5b800";
const BLUE = "#2563eb";

function scoreColor(v: number | null) {
  if (v === null) return "var(--text-dim)";
  return v >= 90 ? GREEN : v >= 75 ? "#b58900" : "#e63946";
}

function Line({ points, pick, color }: { points: DayPoint[]; pick: (p: DayPoint) => number | null; color: string }) {
  const W = 640, H = 180, L = 34, R = 10, T = 10, B = 22;
  const x = (i: number) => L + (points.length <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const segs: string[] = [];
  let cur: string[] = [];
  points.forEach((p, i) => {
    const v = pick(p);
    if (v === null) { if (cur.length) segs.push(cur.join(" ")); cur = []; } else cur.push(`${x(i)},${y(v)}`);
  });
  if (cur.length) segs.push(cur.join(" "));
  return (
    <>
      {segs.map((s, i) => (s.includes(" ") ? <polyline key={i} points={s} fill="none" stroke={color} strokeWidth={2.5} /> : null))}
      {points.map((p, i) => { const v = pick(p); return v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={color} />; })}
    </>
  );
}

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; unit?: string }>;
}) {
  const gestor = await requireGestor();
  const orgId = gestor.organizationId!;
  const sp = await searchParams;
  const today = checklistDayISO();
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  let to = sp.to && iso.test(sp.to) ? sp.to : today;
  if (to > today) to = today;
  let from = sp.from && iso.test(sp.from) ? sp.from : daysBeforeISO(to, 6);
  if (from > to) from = to;
  if (daysBeforeISO(to, 30) > from) from = daysBeforeISO(to, 30);
  const unitId = sp.unit ? Number(sp.unit) : null;

  const [units, { totals, ranking, evolution }] = await Promise.all([getUnits(orgId), getPainelGestor(orgId, from, to, unitId)]);
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const rate = totals.completionRate ?? 0;
  const notStartedPct = totals.scheduled ? Math.round((totals.notStarted / totals.scheduled) * 100) : 0;
  const partialPct = totals.scheduled ? Math.round((totals.startedNotFinished / totals.scheduled) * 100) : 0;

  const kpis: [string, number, string][] = [
    ["Agendados (total)", totals.scheduled, "var(--text-strong)"],
    ["Não iniciados", totals.notStarted, "#e63946"],
    ["Iniciados, não finalizados", totals.startedNotFinished, "#b58900"],
    ["Concluídos", totals.concluded, GREEN],
  ];
  const X0 = 34, X1 = 630, step = evolution.length > 1 ? (X1 - X0) / (evolution.length - 1) : 0;

  return (
    <>
      <div className="page-topbar"><h2 style={{ marginBottom: 0 }}>Indicadores</h2></div>
      <p className="items-count" style={{ marginBottom: 12 }}>
        Checklists diários esperados de cada Gerente e Líder (do modelo dele, da função dele ou geral), um por dia. Semanais ficam de fora; máximo de 31 dias.
      </p>

      <form method="get" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label htmlFor="pf">De</label><input id="pf" type="date" name="from" defaultValue={from} max={today} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label htmlFor="pt">Até</label><input id="pt" type="date" name="to" defaultValue={to} max={today} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="pu">Unidade</label>
          <select id="pu" name="unit" defaultValue={unitId ?? ""}>
            <option value="">Todas as unidades</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <button className="btn-save" type="submit">Filtrar</button>
      </form>

      <div className="summary-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {kpis.map(([label, value, color]) => (
          <div className="summary-card" key={label}>
            <div className="summary-card-label">{label}</div>
            <div className="summary-card-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="board-layout" style={{ gridTemplateColumns: "300px 1fr", marginBottom: 20 }}>
        <div className="today-card">
          <div className="today-card-title" style={{ marginBottom: 12 }}>Taxa de conclusão</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ width: 150, height: 150, borderRadius: "50%", background: totals.scheduled ? `conic-gradient(${GREEN} 0 ${rate}%, var(--border) ${rate}% 100%)` : "var(--border)", display: "grid", placeItems: "center" }}>
              <div style={{ width: 104, height: 104, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 24 }}>
                {totals.completionRate !== null ? `${rate}%` : "—"}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, display: "grid", gap: 4 }}>
            <div>● Concluídos {totals.concluded} ({rate}%)</div>
            <div>● Em andamento {totals.startedNotFinished} ({partialPct}%)</div>
            <div>● Não iniciados {totals.notStarted} ({notStartedPct}%)</div>
          </div>
        </div>

        <div className="today-card">
          <div className="today-card-title" style={{ marginBottom: 12 }}>Ranking por usuário</div>
          {ranking.length === 0 && <p className="empty-state">Nenhum checklist esperado no período.</p>}
          {ranking.map((r, i) => (
            <div key={r.userId} style={{ borderTop: i ? "1px solid var(--border)" : "none", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>{i + 1}. {r.name}{r.unitName ? <span className="items-count"> · {r.unitName}</span> : null}</strong>
                <strong style={{ color: scoreColor(r.overall) }}>{r.overall !== null ? `${r.overall}%` : "—"}</strong>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", margin: "6px 0", overflow: "hidden" }}>
                <div style={{ width: `${r.overall ?? 0}%`, height: "100%", background: scoreColor(r.overall) }} />
              </div>
              <div className="items-count">
                P {r.punctuality ?? "—"}% · E {r.effort ?? "—"}% · Q {r.quality ?? "—"}% · {r.concluded}/{r.expected} concluídos
              </div>
            </div>
          ))}
          <p className="items-count" style={{ marginTop: 10 }}>P = Pontualidade, E = Esforço, Q = Qualidade. Nota geral = média das três.</p>
        </div>
      </div>

      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 6 }}>Evolução no período</div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ color: GREEN }}>● Conclusão</span><span style={{ color: BLUE }}>● Pontualidade</span>
          <span style={{ color: YELLOW }}>● Esforço</span><span style={{ color: "#e63946" }}>● Qualidade</span>
        </div>
        <svg viewBox="0 0 640 180" width="100%" role="img" aria-label="Evolução dos indicadores por dia">
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={34} x2={630} y1={10 + ((100 - v) * 148) / 100} y2={10 + ((100 - v) * 148) / 100} stroke="var(--border)" />
              <text x={28} y={14 + ((100 - v) * 148) / 100} fontSize={10} textAnchor="end" fill="var(--text-dim)">{v}%</text>
            </g>
          ))}
          {evolution.map((p, i) => (evolution.length <= 12 || i % Math.ceil(evolution.length / 10) === 0) ? (
            <text key={p.date} x={X0 + i * step} y={176} fontSize={10} textAnchor="middle" fill="var(--text-dim)">{fmt(p.date)}</text>
          ) : null)}
          <Line points={evolution} pick={(p) => p.completionRate} color={GREEN} />
          <Line points={evolution} pick={(p) => p.punctuality} color={BLUE} />
          <Line points={evolution} pick={(p) => p.effort} color={YELLOW} />
          <Line points={evolution} pick={(p) => p.quality} color="#e63946" />
        </svg>
      </div>
    </>
  );
}
