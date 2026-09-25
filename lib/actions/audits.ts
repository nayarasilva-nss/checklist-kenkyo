"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { auditAnswers, auditGroups, auditItems, audits, units, users } from "@/lib/db/schema";
import { getAuditTemplate } from "@/lib/data/audits";
import { computeAuditScore, type AuditStatus } from "@/lib/audit-scoring";

const STATUSES: AuditStatus[] = ["conforme", "parcial", "nao_conforme", "nao_aplica"];

export async function createAudit(formData: FormData) {
  const gestor = await requireGestor();
  const orgId = gestor.organizationId;
  const unitId = Number(formData.get("unitId"));
  const visitDate = String(formData.get("visitDate") ?? "").trim();
  if (!orgId || !unitId || !visitDate) return;

  const [unit] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.id, unitId), eq(units.organizationId, orgId)))
    .limit(1);
  if (!unit) return;

  // Co-auditor opcional: precisa ser outro gestor da mesma empresa.
  let coAuditorId: number | null = Number(formData.get("coAuditorId")) || null;
  if (coAuditorId) {
    const [partner] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, coAuditorId),
          eq(users.organizationId, orgId),
          inArray(users.profile, ["gestor", "master"]),
        ),
      )
      .limit(1);
    if (!partner || partner.id === gestor.id) coAuditorId = null;
  }

  const template = await getAuditTemplate(orgId);
  const rows = template.flatMap((g, gi) =>
    g.items.map((it, ii) => ({
      groupName: g.name,
      groupPosition: gi,
      itemLabel: it.label,
      itemPosition: ii,
      weight: it.weight,
      howToVerify: it.howToVerify,
      responsible: it.responsible,
      appliesTo: it.appliesTo,
    })),
  );
  if (rows.length === 0) return;

  const [audit] = await db
    .insert(audits)
    .values({ organizationId: orgId, unitId, auditorId: gestor.id, coAuditorId, visitDate })
    .returning({ id: audits.id });
  await db.insert(auditAnswers).values(rows.map((r) => ({ ...r, auditId: audit.id })));
  redirect(`/auditorias/${audit.id}`);
}

async function loadDraft(auditId: number) {
  const gestor = await requireGestor();
  if (!gestor.organizationId) return null;
  const [audit] = await db
    .select()
    .from(audits)
    .where(and(eq(audits.id, auditId), eq(audits.organizationId, gestor.organizationId)))
    .limit(1);
  return audit && audit.status === "rascunho" ? audit : null;
}

export async function saveAuditAnswer(
  auditId: number,
  answerId: number,
  data: { status: AuditStatus | null; note: string; photoUrls: string[] },
) {
  if (!(await loadDraft(auditId))) return { error: "Auditoria não editável" };
  if (data.status && !STATUSES.includes(data.status)) return { error: "Status inválido" };
  await db
    .update(auditAnswers)
    .set({ status: data.status, note: data.note.slice(0, 2000), photoUrls: data.photoUrls.slice(0, 12) })
    .where(and(eq(auditAnswers.id, answerId), eq(auditAnswers.auditId, auditId)));
  return {};
}

export async function saveAuditTexts(auditId: number, comments: string, actionPlan: string) {
  if (!(await loadDraft(auditId))) return { error: "Auditoria não editável" };
  await db.update(audits).set({ comments, actionPlan }).where(eq(audits.id, auditId));
  return {};
}

export async function finalizeAudit(auditId: number) {
  if (!(await loadDraft(auditId))) return { error: "Auditoria não editável" };
  const answers = await db.select().from(auditAnswers).where(eq(auditAnswers.auditId, auditId));
  if (answers.some((a) => !a.status)) return { error: "Responda todos os itens antes de finalizar" };
  const { percent } = computeAuditScore(answers);
  await db
    .update(audits)
    .set({ status: "finalizada", scorePercent: percent, finalizedAt: new Date() })
    .where(eq(audits.id, auditId));
  revalidatePath("/auditorias");
  return {};
}

export async function deleteAudit(formData: FormData) {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  if (!id || !gestor.organizationId) return;
  await db.delete(audits).where(and(eq(audits.id, id), eq(audits.organizationId, gestor.organizationId)));
  revalidatePath("/auditorias");
}

// ---- Modelo (Gerenciar > Auditoria) ----

function itemExtras(formData: FormData) {
  const w = Number(formData.get("weight"));
  return {
    weight: w === 3 || w === 2 ? w : 1,
    howToVerify: String(formData.get("howToVerify") ?? "").trim(),
    responsible: String(formData.get("responsible") ?? "").trim(),
    appliesTo: String(formData.get("appliesTo") ?? "").trim() || "Todas",
  };
}

export async function addAuditGroup(formData: FormData) {
  const gestor = await requireGestor();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !gestor.organizationId) return;
  const [m] = await db
    .select({ v: max(auditGroups.position) })
    .from(auditGroups)
    .where(eq(auditGroups.organizationId, gestor.organizationId));
  await db.insert(auditGroups).values({ organizationId: gestor.organizationId, name, position: (m?.v ?? -1) + 1 });
  revalidatePath("/gerenciar");
}

export async function renameAuditGroup(formData: FormData) {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name || !gestor.organizationId) return;
  await db
    .update(auditGroups)
    .set({ name })
    .where(and(eq(auditGroups.id, id), eq(auditGroups.organizationId, gestor.organizationId)));
  revalidatePath("/gerenciar");
}

export async function deleteAuditGroup(formData: FormData) {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  if (!id || !gestor.organizationId) return;
  await db
    .delete(auditGroups)
    .where(and(eq(auditGroups.id, id), eq(auditGroups.organizationId, gestor.organizationId)));
  revalidatePath("/gerenciar");
}

export async function addAuditItem(formData: FormData) {
  const gestor = await requireGestor();
  const groupId = Number(formData.get("groupId"));
  const label = String(formData.get("label") ?? "").trim();
  if (!groupId || !label || !gestor.organizationId) return;
  const [group] = await db
    .select({ id: auditGroups.id })
    .from(auditGroups)
    .where(and(eq(auditGroups.id, groupId), eq(auditGroups.organizationId, gestor.organizationId)))
    .limit(1);
  if (!group) return;
  const [m] = await db.select({ v: max(auditItems.position) }).from(auditItems).where(eq(auditItems.groupId, groupId));
  await db.insert(auditItems).values({ groupId, label, position: (m?.v ?? -1) + 1, ...itemExtras(formData) });
  revalidatePath("/gerenciar");
}

async function ownItem(itemId: number, orgId: number) {
  const [row] = await db
    .select({ id: auditItems.id })
    .from(auditItems)
    .innerJoin(auditGroups, eq(auditGroups.id, auditItems.groupId))
    .where(and(eq(auditItems.id, itemId), eq(auditGroups.organizationId, orgId)))
    .limit(1);
  return !!row;
}

export async function updateAuditItem(formData: FormData) {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  const label = String(formData.get("label") ?? "").trim();
  if (!id || !label || !gestor.organizationId || !(await ownItem(id, gestor.organizationId))) return;
  await db.update(auditItems).set({ label, ...itemExtras(formData) }).where(eq(auditItems.id, id));
  revalidatePath("/gerenciar");
}

export async function deleteAuditItem(formData: FormData) {
  const gestor = await requireGestor();
  const id = Number(formData.get("id"));
  if (!id || !gestor.organizationId || !(await ownItem(id, gestor.organizationId))) return;
  await db.delete(auditItems).where(eq(auditItems.id, id));
  revalidatePath("/gerenciar");
}
