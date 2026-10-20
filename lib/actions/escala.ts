"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { escalaExcecoes, organizations, users } from "@/lib/db/schema";

export type EscalaState = { error?: string; ok?: string } | undefined;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 62;

function revalidar() {
  revalidatePath("/gerenciar");
  revalidatePath("/hoje");
  revalidatePath("/indicadores");
}

function diasEntre(de: string, ate: string): string[] {
  const out: string[] = [];
  const d = new Date(`${de}T00:00:00Z`);
  const fim = new Date(`${ate}T00:00:00Z`);
  while (d <= fim) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Lança folga (ou trabalho em dia de folga) para uma pessoa, num dia ou período. */
export async function adicionarExcecaoEscala(_prev: EscalaState, formData: FormData): Promise<EscalaState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };

  const userId = Number(formData.get("userId"));
  const tipo = String(formData.get("tipo") ?? "");
  const de = String(formData.get("de") ?? "");
  const ate = String(formData.get("ate") ?? "") || de;
  if (!userId || (tipo !== "folga" && tipo !== "trabalho")) return { error: "Escolha a pessoa e o tipo" };
  if (!ISO.test(de) || !ISO.test(ate)) return { error: "Informe a data" };
  if (ate < de) return { error: "A data final é antes da inicial" };
  const dias = diasEntre(de, ate);
  if (dias.length > MAX_DIAS) return { error: `O período pode ter no máximo ${MAX_DIAS} dias` };

  const [alvo] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, gestor.organizationId)))
    .limit(1);
  if (!alvo) return { error: "Pessoa não encontrada" };

  await db
    .insert(escalaExcecoes)
    .values(dias.map((date) => ({ organizationId: gestor.organizationId!, userId, date, tipo })))
    .onConflictDoUpdate({ target: [escalaExcecoes.userId, escalaExcecoes.date], set: { tipo } });

  revalidar();
  return { ok: `${dias.length} dia${dias.length > 1 ? "s" : ""} lançado${dias.length > 1 ? "s" : ""}` };
}

export async function removerExcecaoEscala(formData: FormData): Promise<void> {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  if (!id || !gestor.organizationId) return;
  await db
    .delete(escalaExcecoes)
    .where(and(eq(escalaExcecoes.id, id), eq(escalaExcecoes.organizationId, gestor.organizationId)));
  revalidar();
}

/** Data a partir da qual vale a folga de cada pessoa (vazio = só o domingo de todos). */
export async function definirInicioEscala(_prev: EscalaState, formData: FormData): Promise<EscalaState> {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return { error: "Conta sem empresa associada" };
  const raw = String(formData.get("desde") ?? "");
  if (raw && !ISO.test(raw)) return { error: "Data inválida" };
  await db
    .update(organizations)
    .set({ escalaVigenteDesde: raw || null })
    .where(eq(organizations.id, gestor.organizationId));
  revalidar();
  return { ok: raw ? "Início da escala salvo" : "Folga por pessoa desligada: só o domingo" };
}
