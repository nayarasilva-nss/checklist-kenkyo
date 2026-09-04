import "server-only";
import { and, arrayContains, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { anomalies, units, users } from "@/lib/db/schema";

export { ANOMALY_TYPES, ANOMALY_SETORES } from "@/lib/anomaly-constants";

export type AnomalyViewer = {
  id: number;
  profile: string;
  unitId: number | null;
  jobFunctionName: string | null;
};

export type AnomalyScope =
  | { mode: "unit"; unitId: number | null }
  | { mode: "own"; userId: number };

/**
 * Gestor / RH: sees all anomalies (or filtered by requestedUnitId).
 * Gerente / Chefe (função): sees every anomaly reported in their own unit.
 * Everyone else: sees only the anomalies they personally reported.
 */
export function resolveAnomalyScope(
  viewer: AnomalyViewer,
  requestedUnitId: number | null,
): AnomalyScope {
  if (viewer.profile === "gestor" || viewer.profile === "rh") {
    return { mode: "unit", unitId: requestedUnitId };
  }
  if (viewer.profile === "gerente" || viewer.jobFunctionName === "Chefe") {
    return { mode: "unit", unitId: viewer.unitId ?? -1 };
  }
  return { mode: "own", userId: viewer.id };
}

function baseQuery() {
  return db
    .select({
      id: anomalies.id,
      date: anomalies.date,
      relator: anomalies.relator,
      tipos: anomalies.tipos,
      setores: anomalies.setores,
      colaboradoresEnvolvidos: anomalies.colaboradoresEnvolvidos,
      oQueAconteceu: anomalies.oQueAconteceu,
      causaPercebida: anomalies.causaPercebida,
      consequenciaImediata: anomalies.consequenciaImediata,
      acaoTomada: anomalies.acaoTomada,
      sugestaoTratativa: anomalies.sugestaoTratativa,
      status: anomalies.status,
      sourceChecklistCompletionId: anomalies.sourceChecklistCompletionId,
      unitName: units.name,
      userName: users.name,
    })
    .from(anomalies)
    .innerJoin(units, eq(units.id, anomalies.unitId))
    .innerJoin(users, eq(users.id, anomalies.userId));
}

export type AnomalyFilters = {
  tipo?: string | null;
  setor?: string | null;
  /** Only anomalies from this date (YYYY-MM-DD) onward. */
  sinceDate?: string | null;
};

export async function getAnomaliesByScope(
  scope: AnomalyScope,
  filters: AnomalyFilters = {},
) {
  const conditions = [
    scope.mode === "unit"
      ? scope.unitId !== null
        ? eq(anomalies.unitId, scope.unitId)
        : undefined
      : eq(anomalies.userId, scope.userId),
    filters.tipo ? arrayContains(anomalies.tipos, [filters.tipo]) : undefined,
    filters.setor ? arrayContains(anomalies.setores, [filters.setor]) : undefined,
    filters.sinceDate ? gte(anomalies.date, filters.sinceDate) : undefined,
  ].filter((c) => c !== undefined);

  return baseQuery()
    .where(and(...conditions))
    .orderBy(desc(anomalies.date), desc(anomalies.id))
    .limit(200);
}
