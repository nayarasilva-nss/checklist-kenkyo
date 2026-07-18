export const SHIFT_STATUS = [
  { value: "estavel", label: "Estável" },
  { value: "sob_pressao", label: "Sob pressão" },
  { value: "instavel", label: "Instável" },
] as const;

export const LEADERSHIP_ACTIONS = [
  "Corrigi na hora",
  "Reorganizei equipe",
  "Ajustei processo",
  "Escalei",
] as const;

export const TEAM_MANAGEMENT_ACTIONS = [
  "Feedback",
  "Correção de postura",
  "Treinamento",
  "Redistribuição",
] as const;

export const LEADER_SELF_ASSESSMENT = [
  { value: "proativo", label: "Proativo" },
  { value: "reativo", label: "Reativo" },
  { value: "apagando_incendio", label: "Apagando incêndio" },
] as const;
