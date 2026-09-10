import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { requisicoes, requisicaoItens, units, users } from "@/lib/db/schema";
import { canConferirInterna, tiposPermitidos } from "@/lib/auth/requisicoes";
import { checklistDayForInstant, checklistDayISO } from "@/lib/date-utils";

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
 * Quem confere interna (Gerente, Líder de Delivery, Líder de
 * Estoque/Produção) vê todas as requisições — interna e externa — da
 * própria unidade, não só as que criou. Gestor não opera uma unidade
 * fixa: vê tudo, de todas as unidades. Quem só pode criar (cargos de
 * praça) vê as próprias. rh não tem fila de requisição — ver
 * spec-requisicao-kenkyo.md seção 3 e lib/auth/requisicoes.ts.
 *
 * `viewer.unitId` já deve vir resolvido pela unidade efetiva do dia
 * (resolveEffectiveUnitId) — quem está cobrindo outra unidade hoje vê e
 * cria requisições da unidade coberta, não da unidade de origem.
 */
export function resolveRequisicaoScope(viewer: RequisicaoViewer): RequisicaoScope | null {
  if (viewer.profile === "gestor") {
    return { mode: "all" };
  }
  if (canConferirInterna(viewer)) {
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
      relatedRequisicaoId: requisicoes.relatedRequisicaoId,
      createdAt: requisicoes.createdAt,
      editedAt: requisicoes.editedAt,
      concluidoEm: requisicoes.concluidoEm,
    })
    .from(requisicoes)
    .innerJoin(units, eq(units.id, requisicoes.unitId))
    .innerJoin(users, eq(users.id, requisicoes.requesterId));
}

/** Contexto mínimo da requisição original pra quem vê o excedente saber
 * o que ela complementa, sem precisar abrir as duas ao mesmo tempo. */
async function fetchRelatedInfo(relatedIds: number[]) {
  if (relatedIds.length === 0) return new Map<number, { createdAt: Date; requesterName: string }>();
  const rows = await db
    .select({ id: requisicoes.id, createdAt: requisicoes.createdAt, requesterName: users.name })
    .from(requisicoes)
    .innerJoin(users, eq(users.id, requisicoes.requesterId))
    .where(inArray(requisicoes.id, relatedIds));
  return new Map(rows.map((r) => [r.id, { createdAt: r.createdAt, requesterName: r.requesterName }]));
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

  const relatedIds = records
    .map((r) => r.relatedRequisicaoId)
    .filter((id): id is number => id !== null);
  const relatedById = await fetchRelatedInfo(relatedIds);

  return records.map((r) => ({
    ...r,
    itens: itensByRequisicao.get(r.id) ?? [],
    podeEditar: canEditToday(r),
    related: r.relatedRequisicaoId ? (relatedById.get(r.relatedRequisicaoId) ?? null) : null,
  }));
}

/** Requisições de hoje, mesma unidade e tipo, que podem ser apontadas
 * como "original" ao criar um excedente — usado pelo seletor na Nova
 * Requisição. */
export async function getTodayRequisicoesForLink(unitId: number, tipo: string) {
  if (tipo !== "interna" && tipo !== "externa") return [];
  const records = await db
    .select({
      id: requisicoes.id,
      createdAt: requisicoes.createdAt,
      requesterName: users.name,
    })
    .from(requisicoes)
    .innerJoin(users, eq(users.id, requisicoes.requesterId))
    .where(and(eq(requisicoes.unitId, unitId), eq(requisicoes.tipo, tipo)))
    .orderBy(desc(requisicoes.createdAt));

  return records.filter((r) => checklistDayForInstant(r.createdAt) === checklistDayISO());
}

/** Editável só enquanto "aberta" e até o dia de checklist virar (02:00
 * BRT) — o solicitante ainda precisa ser conferido no servidor, isso só
 * decide a janela de tempo. */
function canEditToday(r: { status: string; createdAt: Date }) {
  return r.status === "aberta" && checklistDayForInstant(r.createdAt) === checklistDayISO();
}

export async function getRequisicaoWithItens(id: number) {
  const [requisicao] = await baseQuery().where(eq(requisicoes.id, id)).limit(1);
  if (!requisicao) return null;

  const itens = await db
    .select()
    .from(requisicaoItens)
    .where(eq(requisicaoItens.requisicaoId, id))
    .orderBy(asc(requisicaoItens.id));

  const related = requisicao.relatedRequisicaoId
    ? ((await fetchRelatedInfo([requisicao.relatedRequisicaoId])).get(requisicao.relatedRequisicaoId) ?? null)
    : null;

  return { ...requisicao, itens, podeEditar: canEditToday(requisicao), related };
}
