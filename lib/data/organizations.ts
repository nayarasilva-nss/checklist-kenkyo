import "server-only";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";

/**
 * Não existe um perfil "operador da plataforma" ainda — enquanto isso,
 * quem opera a Kenkyo (a própria empresa-base) é tratado como tal.
 * Provisório: quando o produto tiver clientes de verdade, isso vira um
 * profile próprio em vez de checar o slug da empresa.
 */
export function isPlatformOperator(viewer: { profile: string; organizationSlug: string | null }) {
  return viewer.profile === "gestor" && viewer.organizationSlug === "kenkyo";
}

export async function getOrganizationBySlug(slug: string) {
  const [row] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return row ?? null;
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
