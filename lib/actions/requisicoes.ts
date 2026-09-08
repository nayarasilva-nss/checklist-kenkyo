"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { canConferirRequisicao, canRequestExterna, canRequestInterna } from "@/lib/auth/requisicoes";
import { db } from "@/lib/db";
import { requisicoes, requisicaoItens, catalogUnitMeasureEnum } from "@/lib/db/schema";
import { addHistoryEntry } from "@/lib/data/history";

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
  if (!user.unitId) {
    return { error: "Seu usuário não está vinculado a uma unidade" };
  }

  const urgente = formData.get("urgente") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const itens = parseItens(formData);

  if (itens.length === 0) {
    return { error: "Selecione ao menos um item" };
  }

  const [requisicao] = await db
    .insert(requisicoes)
    .values({ tipo, unitId: user.unitId, requesterId: user.id, urgente, observacao })
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

// Não existe edição depois de enviada — o pedido só pode ser ajustado
// enquanto ainda está sendo montado no formulário (antes do "Enviar
// requisição"). Depois disso, a única forma de mudar é cancelar e criar de
// novo. Ver NovaRequisicaoForm.tsx.

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

export async function conferirRequisicao(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!canConferirRequisicao(user)) {
    return { error: "Você não tem permissão para conferir requisições" };
  }

  const id = Number(formData.get("id"));
  const [existing] = await db.select().from(requisicoes).where(eq(requisicoes.id, id)).limit(1);
  if (!existing) return { error: "Requisição não encontrada" };
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
