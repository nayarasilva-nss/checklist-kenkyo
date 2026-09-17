import "server-only";

type Viewer = { profile: string };

/** Quem pede itens avulsos (rádio, lâmpada, etc.) — Gerente ou Gestor. */
export function canCreateSolicitacao(viewer: Viewer) {
  return viewer.profile === "gerente" || viewer.profile === "gestor";
}

/** Aprovar/reprovar e providenciar a compra — só Gestor. */
export function canApproveSolicitacao(viewer: Viewer) {
  return viewer.profile === "gestor";
}
