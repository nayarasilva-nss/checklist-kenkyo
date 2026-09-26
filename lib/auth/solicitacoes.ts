import "server-only";
import { isGestorProfile } from "@/lib/auth/profile";

type Viewer = { profile: string };

/** Quem pede itens avulsos (rádio, lâmpada, etc.) — qualquer função
 * operacional (Líder, Gerente) ou Gestor. RH fica de fora, mesmo padrão
 * de quem não opera unidade. */
export function canCreateSolicitacao(viewer: Viewer) {
  return viewer.profile === "lider" || viewer.profile === "gerente" || isGestorProfile(viewer.profile);
}

/** Aprovar/reprovar e providenciar a compra — só Gestor. */
export function canApproveSolicitacao(viewer: Viewer) {
  return isGestorProfile(viewer.profile);
}
