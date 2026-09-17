import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { solicitacoes, solicitacaoItens, units, users } from "@/lib/db/schema";

export type SolicitacaoViewer = {
  id: number;
  profile: string;
};

export type SolicitacaoScope = { mode: "all" } | { mode: "own"; userId: number };

/**
 * Gestor vê e aprova todas as solicitações, de qualquer unidade. Gerente
 * (o único perfil que pede, além do Gestor) só vê as próprias — não
 * existe uma fila "da unidade" aqui como em requisição, porque toda
 * solicitação passa pelo Gestor de qualquer forma.
 */
export function resolveSolicitacaoScope(viewer: SolicitacaoViewer): SolicitacaoScope | null {
  if (viewer.profile === "gestor") return { mode: "all" };
  if (viewer.profile === "gerente") return { mode: "own", userId: viewer.id };
  return null;
}

function baseQuery() {
  return db
    .select({
      id: solicitacoes.id,
      unitId: solicitacoes.unitId,
      unitName: units.name,
      requesterId: solicitacoes.requesterId,
      requesterName: users.name,
      date: solicitacoes.date,
      urgente: solicitacoes.urgente,
      observacao: solicitacoes.observacao,
      status: solicitacoes.status,
      aprovadoPorId: solicitacoes.aprovadoPorId,
      aprovadoEm: solicitacoes.aprovadoEm,
      motivoReprovacao: solicitacoes.motivoReprovacao,
      createdAt: solicitacoes.createdAt,
    })
    .from(solicitacoes)
    .innerJoin(units, eq(units.id, solicitacoes.unitId))
    .innerJoin(users, eq(users.id, solicitacoes.requesterId));
}

export async function getSolicitacoesByScope(scope: SolicitacaoScope) {
  const records =
    scope.mode === "own"
      ? await baseQuery().where(eq(solicitacoes.requesterId, scope.userId)).orderBy(desc(solicitacoes.createdAt))
      : await baseQuery().orderBy(desc(solicitacoes.createdAt));

  if (records.length === 0) return [];

  const ids = records.map((r) => r.id);
  const allItens = await db
    .select()
    .from(solicitacaoItens)
    .where(inArray(solicitacaoItens.solicitacaoId, ids))
    .orderBy(asc(solicitacaoItens.id));

  const itensBySolicitacao = new Map<number, typeof allItens>();
  for (const item of allItens) {
    const list = itensBySolicitacao.get(item.solicitacaoId) ?? [];
    list.push(item);
    itensBySolicitacao.set(item.solicitacaoId, list);
  }

  return records.map((r) => ({
    ...r,
    itens: itensBySolicitacao.get(r.id) ?? [],
  }));
}

export async function getSolicitacaoWithItens(id: number) {
  const [solicitacao] = await baseQuery().where(eq(solicitacoes.id, id)).limit(1);
  if (!solicitacao) return null;

  const itens = await db
    .select()
    .from(solicitacaoItens)
    .where(eq(solicitacaoItens.solicitacaoId, id))
    .orderBy(asc(solicitacaoItens.id));

  return { ...solicitacao, itens };
}
