"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireGestor } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { canConferirRequisicao, canRequestExterna, canRequestInterna } from "@/lib/auth/requisicoes";
import type { RequisicaoTipo } from "@/lib/auth/requisicoes";
import { db } from "@/lib/db";
import { requisicoes, requisicaoItens, catalogUnitMeasureEnum } from "@/lib/db/schema";
import { addHistoryEntry } from "@/lib/data/history";
import { resolveRequisicaoScope, linkWindowCutoff } from "@/lib/data/requisicoes";
import { checklistDayForInstant, checklistDayISO } from "@/lib/date-utils";

export type ActionState = { error?: string } | undefined;

const UNIT_MEASURES = catalogUnitMeasureEnum.enumValues;

function isValidUnitMeasure(value: string): value is (typeof UNIT_MEASURES)[number] {
  return (UNIT_MEASURES as readonly string[]).includes(value);
}

function revalidateRequisicaoViews() {
  revalidatePath("/requisicoes");
}

type ParsedItem = {
  catalogItemId: number | null;
  nome: string;
  unidadeMedida: (typeof UNIT_MEASURES)[number];
  qtdPedida: number;
};

function parseItens(formData: FormData): ParsedItem[] {
  const raw = String(formData.get("itensJson") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => ({
      catalogItemId:
        typeof entry?.catalogItemId === "number" && entry.catalogItemId > 0
          ? entry.catalogItemId
          : null,
      nome: typeof entry?.nome === "string" ? entry.nome.trim() : "",
      unidadeMedida: String(entry?.unidadeMedida ?? ""),
      qtdPedida: Number(entry?.qtdPedida),
    }))
    .filter(
      (item): item is ParsedItem =>
        item.nome.length > 0 &&
        isValidUnitMeasure(item.unidadeMedida) &&
        Number.isFinite(item.qtdPedida) &&
        item.qtdPedida > 0,
    );
}

export async function createRequisicao(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();

  const tipo = String(formData.get("tipo") ?? "");
  if (tipo !== "interna" && tipo !== "externa") {
    return { error: "Selecione o tipo de requisição" };
  }
  if (tipo === "interna" && !canRequestInterna(user)) {
    return { error: "Você não tem permissão para criar requisição interna" };
  }
  if (tipo === "externa" && !canRequestExterna(user)) {
    return { error: "Você não tem permissão para criar requisição externa" };
  }

  // Unidade efetiva do dia — quem está cobrindo outra unidade cria pra
  // lá, não pra unidade de origem. Quem não tem unidade fixa (hoje,
  // Gestor) escolhe na hora.
  let unitId = await resolveEffectiveUnitId(user);
  if (!unitId) {
    const rawUnitId = Number(formData.get("unitId"));
    if (!rawUnitId) {
      return { error: "Selecione a unidade" };
    }
    unitId = rawUnitId;
  }

  const urgente = formData.get("urgente") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const itens = parseItens(formData);

  if (itens.length === 0) {
    return { error: "Selecione ao menos um item" };
  }

  // Excedente de uma requisição já enviada (esqueceram um item, ou
  // pediram pouco e precisaram de mais depois) — em vez de editar o
  // pedido original e perder o rastro do que foi previsto vs. do que
  // faltou, isso só linka as duas pra quem confere ver junto. Não trava
  // no dia de checklist atual: o pedido normalmente foi enviado no dia
  // anterior e só é separado no seguinte (mesma janela de
  // getRequisicoesForLink).
  const rawRelatedId = Number(formData.get("relatedRequisicaoId"));
  let relatedRequisicaoId: number | null = null;
  if (rawRelatedId) {
    const [related] = await db
      .select({ id: requisicoes.id, tipo: requisicoes.tipo, unitId: requisicoes.unitId, createdAt: requisicoes.createdAt })
      .from(requisicoes)
      .where(eq(requisicoes.id, rawRelatedId))
      .limit(1);
    if (
      related &&
      related.tipo === tipo &&
      related.unitId === unitId &&
      related.createdAt >= linkWindowCutoff()
    ) {
      relatedRequisicaoId = related.id;
    }
  }

  const [requisicao] = await db
    .insert(requisicoes)
    .values({ tipo, unitId, requesterId: user.id, urgente, observacao, relatedRequisicaoId })
    .returning({ id: requisicoes.id });

  await db.insert(requisicaoItens).values(
    itens.map((item) => ({
      requisicaoId: requisicao.id,
      catalogItemId: item.catalogItemId,
      nome: item.nome,
      unidadeMedida: item.unidadeMedida,
      qtdPedida: item.qtdPedida.toFixed(2),
    })),
  );

  await addHistoryEntry(
    user.id,
    `Requisição ${tipo} criada (${itens.length} ${itens.length === 1 ? "item" : "itens"})`,
    "completed",
  );

  revalidateRequisicaoViews();
}

/** Editável só pelo próprio solicitante, enquanto "aberta" e só até o dia
 * de checklist virar (02:00 BRT) — depois disso, mesmo ainda "aberta",
 * não dá mais pra editar (só cancelar). */
function podeEditar(existing: { requesterId: number; status: string; createdAt: Date }, userId: number) {
  return (
    existing.requesterId === userId &&
    existing.status === "aberta" &&
    checklistDayForInstant(existing.createdAt) === checklistDayISO()
  );
}

export async function updateRequisicao(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Requisição inválida" };

  const [existing] = await db.select().from(requisicoes).where(eq(requisicoes.id, id)).limit(1);
  if (!existing) return { error: "Requisição não encontrada" };
  if (!podeEditar(existing, user.id)) {
    return { error: "Essa requisição não pode mais ser editada — o dia já virou ou ela já foi conferida/cancelada." };
  }

  const urgente = formData.get("urgente") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const itens = parseItens(formData);

  if (itens.length === 0) {
    return { error: "Selecione ao menos um item" };
  }

  await db
    .update(requisicoes)
    .set({ urgente, observacao, editedAt: new Date() })
    .where(eq(requisicoes.id, id));

  await db.delete(requisicaoItens).where(eq(requisicaoItens.requisicaoId, id));
  await db.insert(requisicaoItens).values(
    itens.map((item) => ({
      requisicaoId: id,
      catalogItemId: item.catalogItemId,
      nome: item.nome,
      unidadeMedida: item.unidadeMedida,
      qtdPedida: item.qtdPedida.toFixed(2),
    })),
  );

  revalidateRequisicaoViews();
}

export async function cancelRequisicao(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  const [existing] = await db.select().from(requisicoes).where(eq(requisicoes.id, id)).limit(1);
  if (!existing || existing.requesterId !== user.id || existing.status !== "aberta") return;

  await db
    .update(requisicoes)
    .set({ status: "cancelada", concluidoEm: new Date() })
    .where(eq(requisicoes.id, id));

  revalidateRequisicaoViews();
}

/** Exclusão definitiva — só Gestor, diferente de cancelar (que qualquer
 * solicitante faz na própria requisição "aberta" e mantém o registro).
 * requisicaoItens vai junto via onDelete cascade; excedentes ligados a
 * essa aqui (related_requisicao_id) ficam com o vínculo nulo em vez de
 * também serem apagados. */
export async function deleteRequisicao(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;

  await db.delete(requisicoes).where(eq(requisicoes.id, id));

  revalidateRequisicaoViews();
}

export async function conferirRequisicao(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();

  const id = Number(formData.get("id"));
  const [existing] = await db.select().from(requisicoes).where(eq(requisicoes.id, id)).limit(1);
  if (!existing) return { error: "Requisição não encontrada" };
  if (!canConferirRequisicao(user, existing.tipo as RequisicaoTipo)) {
    return { error: "Você não tem permissão para conferir essa requisição" };
  }

  // canConferirRequisicao só olha o cargo — quem confere por unidade
  // (Gerente, Líder de Delivery, Líder de Estoque/Produção) só pode
  // conferir requisições da própria unidade efetiva do dia, mesma regra
  // já aplicada na listagem e no PDF. Gestor (scope "all") confere de
  // qualquer unidade.
  const effectiveUnitId = await resolveEffectiveUnitId(user);
  const scope = resolveRequisicaoScope({ ...user, unitId: effectiveUnitId });
  const podeConferir =
    scope?.mode === "all" || (scope?.mode === "unit" && scope.unitId === existing.unitId);
  if (!podeConferir) {
    return { error: "Você não tem permissão para conferir essa requisição" };
  }

  if (existing.status !== "aberta") {
    return { error: "Essa requisição já foi conferida" };
  }

  const itens = await db
    .select()
    .from(requisicaoItens)
    .where(eq(requisicaoItens.requisicaoId, id));

  for (const item of itens) {
    const raw = formData.get(`qtd-${item.id}`);
    const qtdConferida = raw !== null ? Number(raw) : Number(item.qtdPedida);
    if (!Number.isFinite(qtdConferida) || qtdConferida < 0) {
      return { error: "Quantidade conferida inválida" };
    }
    await db
      .update(requisicaoItens)
      .set({ qtdConferida: qtdConferida.toFixed(2) })
      .where(and(eq(requisicaoItens.id, item.id), eq(requisicaoItens.requisicaoId, id)));
  }

  await db
    .update(requisicoes)
    .set({ status: "conferida", conferidoPorId: user.id, concluidoEm: new Date() })
    .where(eq(requisicoes.id, id));

  await addHistoryEntry(
    user.id,
    `Requisição ${existing.tipo} conferida (unidade ${existing.unitId})`,
    "completed",
  );

  revalidateRequisicaoViews();
}
