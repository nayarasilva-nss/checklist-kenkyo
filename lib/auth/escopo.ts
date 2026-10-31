import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/dal";

/**
 * O escopo por empresa em um lugar só (fase de escalonamento multi-empresa).
 *
 * Toda leitura e escrita de dados operacionais passa por aqui: o orgId vem
 * SEMPRE do usuário logado (nunca do cliente, nunca de parâmetro de URL).
 * Empresa sem id (conta órfã de migração) não lê nada — falha fechada,
 * não aberta.
 */
export const orgIdObrigatorio = cache(async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user.organizationId) {
    throw new Error("Conta sem empresa associada: nada a ler nem a escrever.");
  }
  return user.organizationId;
});

/** Para server actions que já têm o usuário em mão (evita segunda consulta). */
export function orgIdDe(organizationId: number | null | undefined): number {
  if (!organizationId) {
    throw new Error("Conta sem empresa associada: nada a ler nem a escrever.");
  }
  return organizationId;
}
