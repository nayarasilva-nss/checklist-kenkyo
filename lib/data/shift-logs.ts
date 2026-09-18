import "server-only";
import { isGestorProfile } from "@/lib/auth/profile";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { shiftLogPendencias, shiftLogs, units, users } from "@/lib/db/schema";

export type ShiftLogViewer = {
  id: number;
  profile: string;
  unitId: number | null;
};

export type ShiftLogScope =
  | { mode: "unit"; unitId: number | null }
  | { mode: "own"; userId: number };

/**
 * Gestor / RH: sees every shift log (or filtered by requestedUnitId).
 * Everyone else (líder, gerente, chefe): sees only their own — the
 * histórico is personal, not a shared unit view. Open pendências across
 * the whole unit are still surfaced separately on Hoje
 * (getOpenPendenciasForUnit), regardless of who opened them, since those
 * are outstanding action items rather than someone's own record.
 */
export function resolveShiftLogScope(
  viewer: ShiftLogViewer,
  requestedUnitId: number | null,
): ShiftLogScope {
  if (isGestorProfile(viewer.profile) || viewer.profile === "rh") {
    return { mode: "unit", unitId: requestedUnitId };
  }
  return { mode: "own", userId: viewer.id };
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
    .where(
      scope.mode === "unit"
        ? scope.unitId !== null
          ? eq(shiftLogs.unitId, scope.unitId)
          : undefined
        : eq(shiftLogs.userId, scope.userId),
    )
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

export type MyPendencia = OpenPendencia & { concluida: boolean };

/** Every pendência the user has opened across their own shift logs, open first. */
export async function getMyPendencias(userId: number): Promise<MyPendencia[]> {
  const rows = await db
    .select({
      id: shiftLogPendencias.id,
      descricao: shiftLogPendencias.descricao,
      responsavel: shiftLogPendencias.responsavel,
      prazo: shiftLogPendencias.prazo,
      concluida: shiftLogPendencias.concluida,
      shiftLogDate: shiftLogs.date,
      setor: shiftLogs.setor,
    })
    .from(shiftLogPendencias)
    .innerJoin(shiftLogs, eq(shiftLogs.id, shiftLogPendencias.shiftLogId))
    .where(eq(shiftLogs.userId, userId))
    .orderBy(asc(shiftLogPendencias.concluida), asc(shiftLogPendencias.prazo))
    .limit(30);

  return rows;
}
