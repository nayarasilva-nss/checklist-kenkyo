"use server";

import { and, eq, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { catalogItems, jobFunctions, requisicoes, units } from "@/lib/db/schema";
import { enviarPendentesAoErp, enviarRequisicaoAoErp } from "@/lib/erp/integracao";
import { aplicarEspelho, planoEspelho, type PlanoEspelho } from "@/lib/erp/espelho";

export type ActionState = { error?: string; ok?: string } | undefined;

function revalidar() {
  revalidatePath("/gerenciar");
  revalidatePath("/requisicoes");
}

function idOpcional(valor: FormDataEntryValue | null): number | null {
  const n = Number(String(valor ?? "").trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Cada unidade do checklist: qual empresa do ERP ela é e de onde sai cada tipo de requisição. */
export async function salvarUnidadesErp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  const lista = await db.select({ id: units.id }).from(units).where(eq(units.organizationId, gestor.organizationId));
  for (const u of lista) {
    const cnpj = String(formData.get(`cnpj-${u.id}`) ?? "").replace(/\D/g, "");
    if (cnpj && cnpj.length !== 14) return { error: "CNPJ inválido em uma das unidades." };
    await db
      .update(units)
      .set({
        erpCnpj: cnpj || null,
        erpLocalInternoId: idOpcional(formData.get(`interno-${u.id}`)),
        erpLocalExternoId: idOpcional(formData.get(`externo-${u.id}`)),
      })
      .where(and(eq(units.id, u.id), eq(units.organizationId, gestor.organizationId)));
  }
  after(() => enviarPendentesAoErp(gestor.organizationId!).catch(() => 0));
  revalidar();
  return { ok: "Unidades salvas." };
}

/** Cada produto do catálogo: o item do ERP (código) e o fator de conversão. */
export async function salvarItensErp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  const ids = formData.getAll("item").map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return { error: "Nada para salvar." };
  const meus = new Set(
    (await db.select({ id: catalogItems.id }).from(catalogItems)
      .where(and(eq(catalogItems.organizationId, gestor.organizationId), inArray(catalogItems.id, ids)))).map((r) => r.id),
  );
  let ligados = 0;
  const semFator: number[] = [];
  for (const id of ids) {
    if (!meus.has(id)) continue;
    // "CODIGO — nome (UN)" vindo da lista: o código é o que vem antes do travessão
    const escolhido = String(formData.get(`erp-${id}`) ?? "").split(" — ")[0]!.trim();
    const fatorTexto = String(formData.get(`fator-${id}`) ?? "").trim().replace(",", ".");
    const fator = fatorTexto === "" ? null : Number(fatorTexto);
    // escolheu o item mas não disse o fator: não liga (seria baixa errada) e avisa
    if (escolhido && (fator === null || !(fator > 0))) {
      semFator.push(id);
      continue;
    }
    await db
      .update(catalogItems)
      .set({ erpItemCodigo: escolhido || null, erpFator: escolhido && fator ? fator.toFixed(6) : null })
      .where(eq(catalogItems.id, id));
    if (escolhido) ligados++;
  }
  after(() => enviarPendentesAoErp(gestor.organizationId!).catch(() => 0));
  revalidar();
  const aviso = semFator.length > 0 ? ` ${semFator.length} ficaram sem ligar porque falta o fator.` : "";
  return { ok: `Salvo: ${ligados} produto${ligados === 1 ? "" : "s"} ligado${ligados === 1 ? "" : "s"} ao ERP.${aviso}` };
}

/** Manda de novo uma requisição (depois de corrigir o que deu erro). */
export async function reenviarRequisicaoErp(formData: FormData) {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  const [r] = await db.select({ id: requisicoes.id }).from(requisicoes)
    .where(and(eq(requisicoes.id, id), eq(requisicoes.organizationId, gestor.organizationId!))).limit(1);
  if (!r) return;
  await enviarRequisicaoAoErp(r.id);
  revalidar();
}

/**
 * Coloca na fila as requisições conferidas antes da ligação existir, a
 * partir de uma data — para mandar ao ERP o consumo de um mês já passado.
 */
export async function enviarConferidasDesde(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  const desde = String(formData.get("desde") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return { error: "Escolha a data." };
  const marcadas = await db
    .update(requisicoes)
    .set({ erpStatus: "pendente", erpMensagem: null })
    .where(and(
      eq(requisicoes.organizationId, gestor.organizationId),
      eq(requisicoes.status, "conferida"),
      eq(requisicoes.erpStatus, "nao_enviada"),
      gte(requisicoes.concluidoEm, new Date(`${desde}T03:00:00Z`)),
    ))
    .returning({ id: requisicoes.id });
  after(() => enviarPendentesAoErp(gestor.organizationId!, 500).catch(() => 0));
  revalidar();
  return { ok: `${marcadas.length} requisiç${marcadas.length === 1 ? "ão entrou" : "ões entraram"} na fila do ERP. O envio roda em segundo plano: atualize a página em alguns instantes.` };
}

/** Tenta de novo tudo o que está pendente ou aguardando. */
export async function tentarPendentesErp(): Promise<ActionState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  const n = await enviarPendentesAoErp(gestor.organizationId, 100);
  revalidar();
  return { ok: `${n} enviada${n === 1 ? "" : "s"}.` };
}

/**
 * O setor do ERP de cada função. Na requisição, quem tem setor vê só os
 * produtos do setor (o ERP marca quais são); sem setor, vê tudo.
 */
export async function salvarSetoresFuncoes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  const lista = await db.select({ id: jobFunctions.id }).from(jobFunctions).where(eq(jobFunctions.organizationId, gestor.organizationId));
  for (const f of lista) {
    const setor = String(formData.get(`setor-${f.id}`) ?? "").trim().slice(0, 60);
    await db
      .update(jobFunctions)
      .set({ erpSetor: setor || null })
      .where(and(eq(jobFunctions.id, f.id), eq(jobFunctions.organizationId, gestor.organizationId)));
  }
  revalidar();
  return { ok: "Setores salvos." };
}

export type EstadoEspelho = { error?: string; ok?: string; plano?: PlanoEspelho; aplicado?: boolean } | undefined;

/** O que o espelho do catálogo do ERP vai mudar aqui — sem mudar nada. */
export async function verEspelhoErp(): Promise<EstadoEspelho> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  try {
    return { plano: await planoEspelho(gestor.organizationId) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível ler o ERP." };
  }
}

/** Deixa o catálogo daqui igual ao do ERP (ver lib/erp/espelho.ts). */
export async function aplicarEspelhoErp(): Promise<EstadoEspelho> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  try {
    const plano = await aplicarEspelho(gestor.organizationId);
    revalidar();
    return { plano, aplicado: true, ok: "Catálogo igual ao do ERP." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível aplicar." };
  }
}
