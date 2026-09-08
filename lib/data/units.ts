import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { units, jobFunctions } from "@/lib/db/schema";

export async function getUnits() {
  return db.select().from(units).orderBy(asc(units.name));
}

export async function getJobFunctions() {
  return db.select().from(jobFunctions).orderBy(asc(jobFunctions.name));
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
  if (viewer.profile === "gestor" || viewer.profile === "rh") return requestedUnitId;
  return viewer.unitId ?? -1;
}
