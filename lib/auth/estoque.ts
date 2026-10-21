import { isGestorProfile } from "./profile";

/** Quem vê o estoque da unidade (só leitura): Gerente, Líder de Delivery e Gestor. */
export function canVerEstoque(user: { profile: string; jobFunctionName: string | null }) {
  return user.profile === "gerente" || isGestorProfile(user.profile) || user.jobFunctionName === "Líder de Delivery";
}
