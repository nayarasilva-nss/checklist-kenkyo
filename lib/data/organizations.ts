import "server-only";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { checklistCompletions, organizations, users } from "@/lib/db/schema";

export type OrganizationStatus = "pending" | "active" | "suspended";

/** Quem administra outras empresas no /plataforma — perfil "master",
 * independente de qual empresa a conta pertence. */
export function isPlatformOperator(viewer: { profile: string }) {
  return viewer.profile === "master";
}

export async function getOrganizationBySlug(slug: string) {
  const [row] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return row ?? null;
}

export async function getOrganizationById(organizationId: number) {
  const [row] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  return row ?? null;
}

export async function setOrganizationStatus(organizationId: number, status: OrganizationStatus) {
  await db.update(organizations).set({ status }).where(eq(organizations.id, organizationId));
}

export async function updateOrganizationBrand(
  organizationId: number,
  brand: { name: string; logoUrl: string | null; primaryColor: string | null },
) {
  await db.update(organizations).set(brand).where(eq(organizations.id, organizationId));
}

export async function getAllOrganizationsWithStats() {
  const orgs = await db.select().from(organizations).orderBy(organizations.createdAt);
  const userCounts = await db
    .select({ organizationId: users.organizationId, total: count() })
    .from(users)
    .groupBy(users.organizationId);
  const countByOrg = new Map(userCounts.map((r) => [r.organizationId, r.total]));

  return orgs.map((org) => ({ ...org, userCount: countByOrg.get(org.id) ?? 0 }));
}

/**
 * O uso de cada empresa nos últimos 14 dias — o sinal de churn precoce:
 * empresa sem execução nenhuma na quinzena está esfriando, mesmo com
 * status "active". Complementa a lista (não a substitui).
 */
export async function getUsoRecente(): Promise<Map<number, { ultimos14: number; ultimaExecucao: string | null }>> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 14);
  const desdeISO = desde.toISOString().slice(0, 10);
  const rows = await db
    .select({
      organizationId: users.organizationId,
      total: count(),
      ultima: sql<string | null>`max(${checklistCompletions.date})`,
    })
    .from(checklistCompletions)
    .innerJoin(users, eq(users.id, checklistCompletions.userId))
    .where(and(gte(checklistCompletions.date, desdeISO), sql`${users.organizationId} is not null`))
    .groupBy(users.organizationId);
  return new Map(rows.filter((r) => r.organizationId !== null).map((r) => [r.organizationId!, { ultimos14: r.total, ultimaExecucao: r.ultima }]));
}
