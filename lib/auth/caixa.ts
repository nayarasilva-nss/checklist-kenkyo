import { isGestorProfile } from "./profile";

/** Quem fecha o caixa pelo app: líder, gerente e gestor. */
export function canFecharCaixa(user: { profile: string }) {
  return user.profile === "lider" || user.profile === "gerente" || isGestorProfile(user.profile);
}
