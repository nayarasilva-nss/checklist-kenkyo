import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditAnswers, auditGroups, auditItems, audits, units, users } from "@/lib/db/schema";

export async function getAuditTemplate(organizationId: number) {
  const groups = await db
    .select()
    .from(auditGroups)
    .where(eq(auditGroups.organizationId, organizationId))
    .orderBy(asc(auditGroups.position), asc(auditGroups.id));
  const items = await db
    .select({
      id: auditItems.id,
      groupId: auditItems.groupId,
      label: auditItems.label,
      position: auditItems.position,
      weight: auditItems.weight,
      howToVerify: auditItems.howToVerify,
      responsible: auditItems.responsible,
      appliesTo: auditItems.appliesTo,
    })
    .from(auditItems)
    .innerJoin(auditGroups, eq(auditGroups.id, auditItems.groupId))
    .where(eq(auditGroups.organizationId, organizationId))
    .orderBy(asc(auditItems.position), asc(auditItems.id));
  return groups.map((g) => ({ ...g, items: items.filter((i) => i.groupId === g.id) }));
}

export async function getAudits(organizationId: number, unitId: number | null) {
  return db
    .select({
      id: audits.id,
      visitDate: audits.visitDate,
      status: audits.status,
      scorePercent: audits.scorePercent,
      unitId: audits.unitId,
      unitName: units.name,
      auditorName: users.name,
    })
    .from(audits)
    .innerJoin(units, eq(units.id, audits.unitId))
    .innerJoin(users, eq(users.id, audits.auditorId))
    .where(and(eq(audits.organizationId, organizationId), unitId ? eq(audits.unitId, unitId) : undefined))
    .orderBy(desc(audits.visitDate), desc(audits.id));
}

export async function getAudit(id: number, organizationId: number) {
  const [audit] = await db
    .select({
      id: audits.id,
      unitId: audits.unitId,
      unitName: units.name,
      auditorName: users.name,
      visitDate: audits.visitDate,
      status: audits.status,
      scorePercent: audits.scorePercent,
      comments: audits.comments,
      actionPlan: audits.actionPlan,
    })
    .from(audits)
    .innerJoin(units, eq(units.id, audits.unitId))
    .innerJoin(users, eq(users.id, audits.auditorId))
    .where(and(eq(audits.id, id), eq(audits.organizationId, organizationId)))
    .limit(1);
  if (!audit) return null;

  const rows = await db
    .select()
    .from(auditAnswers)
    .where(eq(auditAnswers.auditId, id))
    .orderBy(asc(auditAnswers.groupPosition), asc(auditAnswers.itemPosition), asc(auditAnswers.id));
  const answers = rows.map((r) => ({ ...r, photoUrls: (r.photoUrls as string[]) ?? [] }));
  return { ...audit, answers };
}
