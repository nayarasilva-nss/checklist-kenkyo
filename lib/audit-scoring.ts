export type AuditStatus = "conforme" | "parcial" | "nao_conforme" | "nao_aplica";

export const AUDIT_STATUS_LABEL: Record<AuditStatus, string> = {
  conforme: "Conforme",
  parcial: "Parcialmente conforme",
  nao_conforme: "Não conforme",
  nao_aplica: "Não se aplica",
};

const POINTS: Record<AuditStatus, number> = {
  conforme: 1,
  parcial: 0.5,
  nao_conforme: 0,
  nao_aplica: 0,
};

type Answer = { groupName: string; status: AuditStatus | null };

export function computeAuditScore(answers: Answer[]) {
  const applicable = answers.filter((a) => a.status && a.status !== "nao_aplica");
  const points = applicable.reduce((s, a) => s + POINTS[a.status as AuditStatus], 0);
  const percent = applicable.length > 0 ? Math.round((points / applicable.length) * 100) : 0;

  const byGroup = new Map<string, { total: number; points: number }>();
  for (const a of applicable) {
    const g = byGroup.get(a.groupName) ?? { total: 0, points: 0 };
    g.total += 1;
    g.points += POINTS[a.status as AuditStatus];
    byGroup.set(a.groupName, g);
  }
  const lostByGroup = [...byGroup.entries()]
    .map(([name, g]) => ({ name, lostPercent: Math.round(((g.total - g.points) / g.total) * 100) }))
    .filter((g) => g.lostPercent > 0)
    .sort((a, b) => b.lostPercent - a.lostPercent);

  const count = (s: AuditStatus) => answers.filter((a) => a.status === s).length;
  return {
    percent,
    lostByGroup,
    counts: { conforme: count("conforme"), parcial: count("parcial"), nao_conforme: count("nao_conforme") },
  };
}

export function classifyAudit(percent: number) {
  if (percent >= 90) return { label: "Excelente", color: "#16a34a" };
  if (percent >= 75) return { label: "Bom", color: "#f5b800" };
  if (percent >= 60) return { label: "Regular", color: "#e63946" };
  return { label: "Inadequado", color: "#8a8a8a" };
}
