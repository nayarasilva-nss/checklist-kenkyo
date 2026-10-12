import { isGestorProfile } from "./profile";

/** Quem conta o estoque pelo app: líder (os itens do setor dele), gerente e gestor (tudo). */
export function canContar(user: { profile: string }) {
  return user.profile === "lider" || user.profile === "gerente" || isGestorProfile(user.profile);
}

/** Quem entrega a contagem para conferência no ERP: gerente e gestor. */
export function canEntregarContagem(user: { profile: string }) {
  return user.profile === "gerente" || isGestorProfile(user.profile);
}
