"use server";

import { isGestorProfile } from "@/lib/auth/profile";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { canCreateSolicitacao, canApproveSolicitacao } from "@/lib/auth/solicitacoes";
import { db } from "@/lib/db";
import { solicitacoes, solicitacaoItens } from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

function revalidateSolicitacaoViews() {
  revalidatePath("/solicitacoes");
}

type ParsedItem = { nome: string; quantidade: number };

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
      nome: typeof entry?.nome === "string" ? entry.nome.trim() : "",
      quantidade: Number(entry?.quantidade),
    }))
    .filter(
      (item): item is ParsedItem =>
        item.nome.length > 0 && Number.isFinite(item.quantidade) && item.quantidade > 0,
    );
}

export async function createSolicitacao(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();

  if (!canCreateSolicitacao(user)) {
    return { error: "Você não tem permissão para criar uma solicitação" };
  }

  // Unidade efetiva do dia — quem está cobrindo outra unidade pede pra
  // lá. Quem não tem unidade fixa (hoje, Gestor) escolhe na hora, via
  // unitId no formulário.
  let effectiveUnitId = await resolveEffectiveUnitId(user);
  if (!effectiveUnitId) {
    const rawUnitId = Number(formData.get("unitId"));
    if (!rawUnitId) {
      return { error: "Selecione a unidade" };
    }
    effectiveUnitId = rawUnitId;
  }

  const date = String(formData.get("date") ?? "").trim();
  const urgente = formData.get("urgente") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const itens = parseItens(formData);

  if (!date) return { error: "Informe a data" };
  if (itens.length === 0) return { error: "Selecione ao menos um item" };

  const [solicitacao] = await db
    .insert(solicitacoes)
    .values({ unitId: effectiveUnitId, requesterId: user.id, date, urgente, observacao })
    .returning({ id: solicitacoes.id });

  await db.insert(solicitacaoItens).values(
    itens.map((item) => ({
      solicitacaoId: solicitacao.id,
      nome: item.nome,
      quantidade: item.quantidade,
    })),
  );

  revalidateSolicitacaoViews();
}

/** Cancela o pedido inteiro — só quem pediu, e só enquanto nada foi
 * decidido ainda (nenhum item aprovado/reprovado). Depois que o gestor
 * começou a decidir item a item, não dá mais pra retirar de uma vez. */
export async function cancelSolicitacao(formData: FormData) {
  const user = await getCurrentUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  const [existing] = await db.select().from(solicitacoes).where(eq(solicitacoes.id, id)).limit(1);
  if (!existing || existing.requesterId !== user.id || existing.status !== "aberta") return;

  const itens = await db
    .select({ status: solicitacaoItens.status })
    .from(solicitacaoItens)
    .where(eq(solicitacaoItens.solicitacaoId, id));
  if (itens.some((i) => i.status !== "pendente")) return;

  await db.update(solicitacoes).set({ status: "cancelada" }).where(eq(solicitacoes.id, id));
  revalidateSolicitacaoViews();
}

/** Exclusão definitiva — só Gestor, diferente de cancelar. */
export async function deleteSolicitacao(formData: FormData) {
  const user = await getCurrentUser();
  if (!isGestorProfile(user.profile)) return;
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(solicitacoes).where(eq(solicitacoes.id, id));
  revalidateSolicitacaoViews();
}

/** Aprova ou reprova um item individual — só Gestor. */
export async function decideSolicitacaoItem(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!canApproveSolicitacao(user)) {
    return { error: "Só o gestor pode aprovar ou reprovar um item" };
  }

  const itemId = Number(formData.get("itemId"));
  const decisao = String(formData.get("decisao") ?? "");
  if (!itemId || (decisao !== "aprovado" && decisao !== "reprovado")) {
    return { error: "Requisição inválida" };
  }
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const [existing] = await db
    .select({ status: solicitacaoItens.status })
    .from(solicitacaoItens)
    .where(eq(solicitacaoItens.id, itemId))
    .limit(1);
  if (!existing) return { error: "Item não encontrado" };
  if (existing.status !== "pendente") {
    return { error: "Esse item já foi decidido" };
  }

  await db
    .update(solicitacaoItens)
    .set({
      status: decisao,
      aprovadoPorId: user.id,
      aprovadoEm: new Date(),
      motivoReprovacao: decisao === "reprovado" ? motivo : null,
    })
    .where(eq(solicitacaoItens.id, itemId));

  revalidateSolicitacaoViews();
}

/** Marca um item como comprado (ou desfaz), e a data prevista de
 * entrega — só Gestor, só depois do item aprovado. */
export async function setItemComprado(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!canApproveSolicitacao(user)) {
    return { error: "Só o gestor pode marcar um item como comprado" };
  }

  const itemId = Number(formData.get("itemId"));
  if (!itemId) return { error: "Item inválido" };

  const [existing] = await db
    .select({ status: solicitacaoItens.status })
    .from(solicitacaoItens)
    .where(eq(solicitacaoItens.id, itemId))
    .limit(1);
  if (!existing || existing.status !== "aprovado") {
    return { error: "O item precisa estar aprovado antes de registrar a compra" };
  }

  const comprado = formData.get("comprado") === "on";
  const dataPrevistaEntrega = String(formData.get("dataPrevistaEntrega") ?? "").trim() || null;

  await db
    .update(solicitacaoItens)
    .set({ comprado, dataPrevistaEntrega })
    .where(eq(solicitacaoItens.id, itemId));

  revalidateSolicitacaoViews();
}

/** Marca a chegada de um item — quem pediu (acompanhando o próprio
 * pedido) ou o gestor. */
export async function setItemChegou(formData: FormData) {
  const user = await getCurrentUser();
  const itemId = Number(formData.get("itemId"));
  const solicitacaoId = Number(formData.get("solicitacaoId"));
  if (!itemId || !solicitacaoId) return;

  const [existing] = await db
    .select({ requesterId: solicitacoes.requesterId })
    .from(solicitacoes)
    .where(eq(solicitacoes.id, solicitacaoId))
    .limit(1);
  if (!existing) return;
  if (existing.requesterId !== user.id && !isGestorProfile(user.profile)) return;

  const chegou = formData.get("chegou") === "on";
  await db.update(solicitacaoItens).set({ chegou }).where(eq(solicitacaoItens.id, itemId));

  revalidateSolicitacaoViews();
}
