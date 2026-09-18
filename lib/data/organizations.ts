import "server-only";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";

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
