// Notas de uma resposta de checklist (como na Konclui): Pontualidade,
// Esforço e Qualidade, cada uma de 0 a 100 (ou null quando não se aplica).

export type ScoreItem = {
  status: string;
  justification: string | null;
  photoUrl: string | null;
  requiresPhoto: boolean;
  completedAt: Date | null;
};

const BRT = "America/Sao_Paulo";

/** Minutos desde o início do dia de checklist (vira às 02:00, não à meia-noite). */
function minutesIntoChecklistDay(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: BRT, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")!.value);
  const m = Number(parts.find((p) => p.type === "minute")!.value);
  return (h < 2 ? h + 24 : h) * 60 + m;
}

/** Qualidade: conformes entre os itens avaliados (conforme + não conforme). */
export function qualityScore(items: ScoreItem[]) {
  const ok = items.filter((i) => i.status === "conforme").length;
  const bad = items.filter((i) => i.status === "nao-conforme").length;
  return ok + bad > 0 ? Math.round((ok / (ok + bad)) * 100) : null;
}

/** Esforço: itens respondidos *e* bem documentados (não conforme com
 * justificativa; item que exige foto, com a foto) sobre o total. */
export function effortScore(items: ScoreItem[]) {
  if (items.length === 0) return null;
  const good = items.filter((i) => {
    if (i.status === "pending") return false;
    if (i.status === "nao-conforme" && !i.justification?.trim()) return false;
    if (i.requiresPhoto && i.status !== "nao-se-aplica" && !i.photoUrl) return false;
    return true;
  }).length;
  return Math.round((good / items.length) * 100);
}

/** Pontualidade: 100 se concluiu até o horário-limite; perde 25 pontos a
 * cada 15 min de atraso. Sem horário-limite, ou ainda em andamento dentro
 * do prazo, não há nota (null). Não concluído depois do prazo = 0. */
export function punctualityScore(items: ScoreItem[], deadlineTime: string | null) {
  if (!deadlineTime) return null;
  const [dh, dm] = deadlineTime.split(":").map(Number);
  const deadline = (dh < 2 ? dh + 24 : dh) * 60 + dm;
  const answered = items.filter((i) => i.status !== "pending");
  const done = items.length > 0 && answered.length === items.length;
  if (!done) return null;
  const times = answered.map((i) => i.completedAt).filter((d): d is Date => !!d);
  if (times.length === 0) return null;
  const last = new Date(Math.max(...times.map((d) => d.getTime())));
  const late = Math.max(0, minutesIntoChecklistDay(last) - deadline);
  return Math.max(0, 100 - 25 * Math.ceil(late / 15));
}
