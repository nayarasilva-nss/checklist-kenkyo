import "server-only";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { escalaExcecoes, organizations } from "@/lib/db/schema";
import { estaDeFolga, type TipoExcecao } from "@/lib/escala";

export type Escala = {
  vigenteDesde: string | null;
  /** Está de folga? Já considera a folga fixa e as exceções do dia. */
  deFolga: (userId: number, folgaDias: number[], date: string) => boolean;
};

export async function carregarEscala(organizationId: number, userIds: number[], from: string, to: string): Promise<Escala> {
  const [org] = await db
    .select({ desde: organizations.escalaVigenteDesde })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  const vigenteDesde = org?.desde ?? null;

  const excecoes = new Map<string, TipoExcecao>();
  if (userIds.length > 0) {
    const rows = await db
      .select({ userId: escalaExcecoes.userId, date: escalaExcecoes.date, tipo: escalaExcecoes.tipo })
      .from(escalaExcecoes)
      .where(and(inArray(escalaExcecoes.userId, userIds), gte(escalaExcecoes.date, from), lte(escalaExcecoes.date, to)));
    for (const r of rows) excecoes.set(`${r.userId}|${r.date}`, r.tipo as TipoExcecao);
  }

  return {
    vigenteDesde,
    deFolga: (userId, folgaDias, date) => estaDeFolga(folgaDias, date, vigenteDesde, excecoes.get(`${userId}|${date}`)),
  };
}
