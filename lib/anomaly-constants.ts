export const ANOMALY_TYPES = [
  "Operacional",
  "Comportamental",
  "Qualidade do produto",
  "Gerencial",
  "Atendimento ao cliente",
  "Segurança alimentar",
] as const;

export const ANOMALY_SETORES = [
  "Cozinha",
  "Sushibar",
  "Bar",
  "Copa",
  "Produção",
  "Atendimento - Salão",
  "Atendimento - Delivery",
] as const;

// Best-effort setor guess for anomalies generated automatically from a
// checklist item, based on the checklist type's own name (e.g. "Abertura —
// Líder de Sushibar"). Order matters: "sushibar" must be checked before the
// generic "bar" pattern. Falls back to "Cozinha" when nothing matches — a
// Gestor reviewing the anomaly can correct it if it's wrong.
const SETOR_KEYWORDS: [RegExp, (typeof ANOMALY_SETORES)[number]][] = [
  [/sushibar/i, "Sushibar"],
  [/delivery/i, "Atendimento - Delivery"],
  [/sal[aã]o/i, "Atendimento - Salão"],
  [/cozinha/i, "Cozinha"],
  [/estoque|produ[cç][aã]o/i, "Produção"],
  [/copa/i, "Copa"],
  [/\bbar\b/i, "Bar"],
];

export function guessSetorFromText(text: string): (typeof ANOMALY_SETORES)[number] {
  for (const [pattern, setor] of SETOR_KEYWORDS) {
    if (pattern.test(text)) return setor;
  }
  return "Cozinha";
}
