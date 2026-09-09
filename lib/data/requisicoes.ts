import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { requisicoes, requisicaoItens, units, users } from "@/lib/db/schema";
import { canConferirInterna, tiposPermitidos } from "@/lib/auth/requisicoes";

export type RequisicaoViewer = {
  id: number;
  profile: string;
  unitId: number | null;
  jobFunctionName: string | null;
};

export type RequisicaoScope =
  | { mode: "unit"; unitId: number }
  | { mode: "all" }
  | { mode: "own"; userId: number; unitId: number };

/**
 * Gerente vê todas as requisições (interna e externa) da própria unidade,
 * não só as que ele criou — mesmo escopo do Líder de Estoque/Produção, que
 * além de ver também confere (ver canConferirInterna/Externa). Gestor não
 * opera uma unidade fixa: vê tudo, de todas as unidades. Quem só pode
 * criar (cargos de praça) vê as próprias. rh não tem fila de requisição —
 * ver spec-requisicao-kenkyo.md seção 3 e lib/auth/requisicoes.ts.
 */
export function resolveRequisicaoScope(viewer: RequisicaoViewer): RequisicaoScope | null {
  if (viewer.profile === "gestor") {
    return { mode: "all" };
  }
  if (viewer.profile === "gerente" || canConferirInterna(viewer)) {
    return { mode: "unit", unitId: viewer.unitId ?? -1 };
  }
  if (tiposPermitidos(viewer).length === 0) return null;
  return { mode: "own", userId: viewer.id, unitId: viewer.unitId ?? -1 };
}

function baseQuery() {
  return db
    .select({
      id: requisicoes.id,
      tipo: requisicoes.tipo,
      unitId: requisicoes.unitId,
      unitName: units.name,
      requesterId: requisicoes.requesterId,
      requesterName: users.name,
      urgente: requisicoes.urgente,
      observacao: requisicoes.observacao,
      status: requisicoes.status,
      conferidoPorId: requisicoes.conferidoPorId,
      createdAt: requisicoes.createdAt,
      editedAt: requisicoes.editedAt,
      concluidoEm: requisicoes.concluidoEm,
    })
    .from(requisicoes)
    .innerJoin(units, eq(units.id, requisicoes.unitId))
    .innerJoin(users, eq(users.id, requisicoes.requesterId));
}

export async function getRequisicoesByScope(scope: RequisicaoScope, tipo?: string | null) {
  const conditions = [
    scope.mode === "unit"
      ? eq(requisicoes.unitId, scope.unitId)
      : scope.mode === "own"
        ? eq(requisicoes.requesterId, scope.userId)
        : undefined, // "all": todas as unidades, sem filtro de solicitante
    tipo === "interna" || tipo === "externa" ? eq(requisicoes.tipo, tipo) : undefined,
  ].filter((c) => c !== undefined);

  const records = await baseQuery()
    .where(and(...conditions))
    .orderBy(desc(requisicoes.createdAt));

  if (records.length === 0) return [];

  const ids = records.map((r) => r.id);
  const allItens = await db
    .select()
    .from(requisicaoItens)
    .where(inArray(requisicaoItens.requisicaoId, ids));
  const itensByRequisicao = new Map<number, typeof allItens>();
  for (const item of allItens) {
    const list = itensByRequisicao.get(item.requisicaoId) ?? [];
    list.push(item);
    itensByRequisicao.set(item.requisicaoId, list);
  }

  return records.map((r) => ({ ...r, itens: itensByRequisicao.get(r.id) ?? [] }));
}

export async function getRequisicaoWithItens(id: number) {
  const [requisicao] = await baseQuery().where(eq(requisicoes.id, id)).limit(1);
  if (!requisicao) return null;

  const itens = await db
    .select()
    .from(requisicaoItens)
    .where(eq(requisicaoItens.requisicaoId, id))
    .orderBy(asc(requisicaoItens.id));

  return { ...requisicao, itens };
}
