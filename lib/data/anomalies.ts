import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { anomalies, units, users } from "@/lib/db/schema";

export { ANOMALY_TYPES, ANOMALY_SETORES } from "@/lib/anomaly-constants";

export async function getAnomalies(unitId: number | null) {
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
      unitName: units.name,
      userName: users.name,
    })
    .from(anomalies)
    .innerJoin(units, eq(units.id, anomalies.unitId))
    .innerJoin(users, eq(users.id, anomalies.userId))
    .where(unitId !== null ? eq(anomalies.unitId, unitId) : undefined)
    .orderBy(desc(anomalies.date), desc(anomalies.id))
    .limit(200);
}
