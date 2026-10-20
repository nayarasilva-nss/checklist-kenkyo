import { isGestorProfile } from "@/lib/auth/profile";

/** Quem vê a escala (só leitura): Gestor, Gerente e o Chefe da unidade. */
export function canVerEscala(viewer: { profile: string; jobFunctionName: string | null }) {
  return isGestorProfile(viewer.profile) || viewer.profile === "gerente" || viewer.jobFunctionName === "Chefe";
}
