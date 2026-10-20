import "server-only";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { escalaExcecoes, jobFunctions, organizations, users } from "@/lib/db/schema";
import { diaDaSemana, estaDeFolga, type TipoExcecao } from "@/lib/escala";

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

export type EscalaMes = {
  vigenteDesde: string | null;
  dias: { date: string; dow: number }[];
  pessoas: { id: number; name: string; funcao: string | null; folgas: Set<string> }[];
};

/** A escala do mês (YYYY-MM) de uma unidade: quem está de folga em cada dia. */
export async function getEscalaMes(organizationId: number, unitId: number, mes: string): Promise<EscalaMes> {
  const [y, m] = mes.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dias = Array.from({ length: total }, (_, i) => {
    const date = `${mes}-${String(i + 1).padStart(2, "0")}`;
    return { date, dow: diaDaSemana(date) };
  });

  const pessoas = await db
    .select({ id: users.id, name: users.name, funcao: jobFunctions.name, folgaDias: users.folgaDias })
    .from(users)
    .leftJoin(jobFunctions, eq(jobFunctions.id, users.jobFunctionId))
    .where(and(eq(users.organizationId, organizationId), eq(users.unitId, unitId), inArray(users.profile, ["gerente", "lider"])))
    .orderBy(asc(users.name));

  const escala = await carregarEscala(organizationId, pessoas.map((p) => p.id), dias[0].date, dias[total - 1].date);
  return {
    vigenteDesde: escala.vigenteDesde,
    dias,
    pessoas: pessoas.map((p) => ({
      id: p.id,
      name: p.name,
      funcao: p.funcao,
      folgas: new Set(dias.filter((d) => escala.deFolga(p.id, p.folgaDias, d.date)).map((d) => d.date)),
    })),
  };
}
