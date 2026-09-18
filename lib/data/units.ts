import "server-only";
import { isGestorProfile } from "@/lib/auth/profile";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { units, jobFunctions } from "@/lib/db/schema";

export async function getUnits(organizationId: number) {
  return db
    .select()
    .from(units)
    .where(eq(units.organizationId, organizationId))
    .orderBy(asc(units.name));
}

export async function getJobFunctions(organizationId: number) {
  return db
    .select()
    .from(jobFunctions)
    .where(eq(jobFunctions.organizationId, organizationId))
    .orderBy(asc(jobFunctions.name));
}

/**
 * Gestor e RH: requestedUnitId as-is (null = todas as unidades) — RH
 * acompanha o preenchimento de checklist de todas as unidades, mesmo
 * padrão de visibilidade cross-unidade que já tem em Anomalias.
 * Gerente/Líder: forced to their own unit; -1 (no matches) if they have none assigned yet.
 */
export function resolveUnitScope(
  viewer: { profile: string; unitId: number | null },
  requestedUnitId: number | null,
): number | null {
  if (isGestorProfile(viewer.profile) || viewer.profile === "rh") return requestedUnitId;
  return viewer.unitId ?? -1;
}
