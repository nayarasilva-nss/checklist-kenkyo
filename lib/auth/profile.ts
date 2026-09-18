export type Profile = "gestor" | "gerente" | "lider" | "rh" | "master";

/** "master" tem tudo que "gestor" tem, mais acesso a /plataforma
 * (gerenciar outras empresas do sistema). Use isto em vez de comparar
 * com "gestor" direto em qualquer checagem de permissão. No import de
 * "server-only" porque é usado também em componentes client (AppNav). */
export function isGestorProfile(profile: string) {
  return profile === "gestor" || profile === "master";
}
