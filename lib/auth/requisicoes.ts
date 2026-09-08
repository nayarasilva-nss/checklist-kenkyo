import "server-only";

export type RequisicaoTipo = "interna" | "externa";

type Viewer = { profile: string; jobFunctionName: string | null };

/**
 * Todo mundo pede requisição interna, exceto gestor (só administra o
 * catálogo, não opera unidade) e rh (não faz operação de unidade, mesmo
 * padrão usado em canCreateAnomaly). Só gerente pede externa.
 */
export function canRequestInterna(viewer: Viewer) {
  return viewer.profile !== "gestor" && viewer.profile !== "rh";
}

export function canRequestExterna(viewer: Viewer) {
  return viewer.profile === "gerente";
}

export function tiposPermitidos(viewer: Viewer): RequisicaoTipo[] {
  const tipos: RequisicaoTipo[] = [];
  if (canRequestInterna(viewer)) tipos.push("interna");
  if (canRequestExterna(viewer)) tipos.push("externa");
  return tipos;
}

/** Confere (interna e externa) só o Líder de Estoque/Produção. */
export function canConferirRequisicao(viewer: Viewer) {
  return viewer.jobFunctionName === "Líder de Estoque/Produção";
}
