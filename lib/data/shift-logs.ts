import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { shiftLogPendencias, shiftLogs, units, users } from "@/lib/db/schema";

export type ShiftLogViewer = {
  id: number;
  profile: string;
  unitId: number | null;
};

export type ShiftLogScope = { unitId: number | null };

/**
 * Gestor / RH: sees every shift log (or filtered by requestedUnitId).
 * Everyone else (líder, gerente, chefe): sees every shift log from their
 * own unit, so the next shift's leader can read the previous handoff —
 * unlike Anomalias, this isn't restricted to "own records only" because
 * continuity between shifts is the whole point of the feature.
 */
export function resolveShiftLogScope(
  viewer: ShiftLogViewer,
  requestedUnitId: number | null,
): ShiftLogScope {
  if (viewer.profile === "gestor" || viewer.profile === "rh") {
    return { unitId: requestedUnitId };
  }
  return { unitId: viewer.unitId ?? -1 };
}

function baseQuery() {
  return db
    .select({
      id: shiftLogs.id,
      date: shiftLogs.date,
      setor: shiftLogs.setor,
      statusTurno: shiftLogs.statusTurno,
      statusJustificativa: shiftLogs.statusJustificativa,
      desvioDescricao: shiftLogs.desvioDescricao,
      desvioImpacto: shiftLogs.desvioImpacto,
      desvioCausaRaiz: shiftLogs.desvioCausaRaiz,
      acoesLideranca: shiftLogs.acoesLideranca,
      acaoLiderancaDescricao: shiftLogs.acaoLiderancaDescricao,
      outrasDecisoes: shiftLogs.outrasDecisoes,
      gestaoEquipe: shiftLogs.gestaoEquipe,
      gestaoEquipeDescricao: shiftLogs.gestaoEquipeDescricao,
      autoavaliacao: shiftLogs.autoavaliacao,
      autoavaliacaoMelhorias: shiftLogs.autoavaliacaoMelhorias,
      unitName: units.name,
      liderNome: users.name,
    })
    .from(shiftLogs)
    .innerJoin(units, eq(units.id, shiftLogs.unitId))
    .innerJoin(users, eq(users.id, shiftLogs.userId));
}

export async function getShiftLogsByScope(scope: ShiftLogScope) {
  const records = await baseQuery()
    .where(scope.unitId !== null ? eq(shiftLogs.unitId, scope.unitId) : undefined)
    .orderBy(desc(shiftLogs.date), desc(shiftLogs.id))
    .limit(200);

  const ids = records.map((r) => r.id);
  const pendencias = ids.length
    ? await db
        .select({
          shiftLogId: shiftLogPendencias.shiftLogId,
          descricao: shiftLogPendencias.descricao,
          responsavel: shiftLogPendencias.responsavel,
          prazo: shiftLogPendencias.prazo,
        })
        .from(shiftLogPendencias)
        .where(inArray(shiftLogPendencias.shiftLogId, ids))
    : [];

  const pendenciasByLog = new Map<number, typeof pendencias>();
  for (const p of pendencias) {
    const list = pendenciasByLog.get(p.shiftLogId) ?? [];
    list.push(p);
    pendenciasByLog.set(p.shiftLogId, list);
  }

  return records.map((r) => ({
    ...r,
    pendencias: pendenciasByLog.get(r.id) ?? [],
  }));
}

export type OpenPendencia = {
  id: number;
  descricao: string;
  responsavel: string | null;
  prazo: string | null;
  shiftLogDate: string;
  setor: string;
};

/** Open (não concluídas) pendências from any shift log in the unit, oldest deadline first. */
export async function getOpenPendenciasForUnit(unitId: number): Promise<OpenPendencia[]> {
  const rows = await db
    .select({
      id: shiftLogPendencias.id,
      descricao: shiftLogPendencias.descricao,
      responsavel: shiftLogPendencias.responsavel,
      prazo: shiftLogPendencias.prazo,
      shiftLogDate: shiftLogs.date,
      setor: shiftLogs.setor,
    })
    .from(shiftLogPendencias)
    .innerJoin(shiftLogs, eq(shiftLogs.id, shiftLogPendencias.shiftLogId))
    .where(and(eq(shiftLogs.unitId, unitId), eq(shiftLogPendencias.concluida, false)))
    .orderBy(asc(shiftLogPendencias.prazo), desc(shiftLogs.date))
    .limit(50);

  return rows;
}
