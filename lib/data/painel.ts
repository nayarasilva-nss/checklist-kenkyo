import "server-only";
import { and, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { checklistCompletions, checklistTypeItems, checklistTypes, units, users } from "@/lib/db/schema";
import { daysBeforeISO } from "@/lib/date-utils";
import { deadlineMinutes, effortScore, minutesIntoChecklistDay, punctualityScore, qualityScore, type ScoreItem } from "@/lib/checklist-scoring";
import { checklistDayISO } from "@/lib/date-utils";

export type RankingRow = {
  userId: number;
  name: string;
  unitName: string | null;
  expected: number;
  concluded: number;
  completionRate: number;
  punctuality: number | null;
  effort: number | null;
  quality: number | null;
  overall: number | null;
};

export type DayPoint = {
  date: string;
  expected: number;
  concluded: number;
  completionRate: number | null;
  punctuality: number | null;
  effort: number | null;
  quality: number | null;
};

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};

function eachDay(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to; d = daysBeforeISO(d, -1)) out.push(d);
  return out;
}

/**
 * "Agendado" = cada checklist diário que uma pessoa (Gerente/Líder com
 * unidade) deveria fazer em cada dia do período — mesma regra de
 * visibilidade da tela de Checklists (modelo atribuído a ela, ou da função
 * dela, ou geral). Não há agenda por horário: o dia inteiro é a janela.
 * Checklists semanais ficam de fora.
 */
type Inst = { userId: number; userName: string; unitName: string | null; typeName: string; deadlineTime: string | null; answered: number; total: number; date: string; state: "none" | "partial" | "done"; p: number | null; e: number | null; q: number | null };

async function loadInstances(organizationId: number, from: string, to: string, unitId: number | null, jobFunctionId: number | null = null) {
  const people = await db
    .select({ id: users.id, name: users.name, unitId: users.unitId, unitName: units.name, jobFunctionId: users.jobFunctionId })
    .from(users)
    .leftJoin(units, eq(units.id, users.unitId))
    .where(
      and(
        eq(users.organizationId, organizationId),
        inArray(users.profile, ["gerente", "lider"]),
        isNotNull(users.unitId),
        unitId ? eq(users.unitId, unitId) : undefined,
        jobFunctionId ? eq(users.jobFunctionId, jobFunctionId) : undefined,
      ),
    );

  const types = await db
    .select({ id: checklistTypes.id, name: checklistTypes.name, jobFunctionId: checklistTypes.jobFunctionId, assignedUserId: checklistTypes.assignedUserId, deadlineTime: checklistTypes.deadlineTime })
    .from(checklistTypes)
    .where(and(eq(checklistTypes.organizationId, organizationId), eq(checklistTypes.type, "daily"), eq(checklistTypes.active, true)));
  const items = types.length
    ? await db
        .select({ id: checklistTypeItems.id, checklistTypeId: checklistTypeItems.checklistTypeId, requiresPhoto: checklistTypeItems.requiresPhoto })
        .from(checklistTypeItems)
        .where(inArray(checklistTypeItems.checklistTypeId, types.map((t) => t.id)))
    : [];
  const itemsByType = new Map<number, typeof items>();
  for (const it of items) itemsByType.set(it.checklistTypeId, [...(itemsByType.get(it.checklistTypeId) ?? []), it]);

  const rows = people.length
    ? await db
        .select()
        .from(checklistCompletions)
        .where(and(inArray(checklistCompletions.userId, people.map((p) => p.id)), gte(checklistCompletions.date, from), lte(checklistCompletions.date, to)))
    : [];
  const byKey = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = `${r.checklistTypeId}|${r.userId}|${r.date}`;
    byKey.set(k, [...(byKey.get(k) ?? []), r]);
  }

  const days = eachDay(from, to);
  const insts: Inst[] = [];
  for (const p of people) {
    for (const t of types) {
      const visible = t.assignedUserId !== null ? t.assignedUserId === p.id : t.jobFunctionId === null || t.jobFunctionId === p.jobFunctionId;
      const typeItems = itemsByType.get(t.id) ?? [];
      if (!visible || typeItems.length === 0) continue;
      for (const date of days) {
        const answered = byKey.get(`${t.id}|${p.id}|${date}`) ?? [];
        const scoreItems: ScoreItem[] = typeItems.map((it) => {
          const c = answered.find((a) => a.itemId === it.id && a.status !== "pending");
          return { status: c?.status ?? "pending", justification: c?.justification ?? null, photoUrl: c?.photoUrl ?? null, requiresPhoto: it.requiresPhoto, completedAt: c?.completedAt ?? null };
        });
        const n = scoreItems.filter((i) => i.status !== "pending").length;
        const state = n === 0 ? "none" : n < scoreItems.length ? "partial" : "done";
        insts.push({
          userId: p.id,
          userName: p.name,
          unitName: p.unitName,
          typeName: t.name,
          deadlineTime: t.deadlineTime,
          answered: n,
          total: scoreItems.length,
          date,
          state,
          p: state === "done" ? punctualityScore(scoreItems, t.deadlineTime) : null,
          e: state === "none" ? null : effortScore(scoreItems),
          q: state === "none" ? null : qualityScore(scoreItems),
        });
      }
    }
  }

  return insts;
}

export async function getPainelGestor(organizationId: number, from: string, to: string, unitId: number | null, jobFunctionId: number | null = null) {
  const insts = await loadInstances(organizationId, from, to, unitId, jobFunctionId);
  const days = eachDay(from, to);
  const people = [...new Map(insts.map((i) => [i.userId, { id: i.userId, name: i.userName, unitName: i.unitName }])).values()];

  const count = (s: Inst["state"]) => insts.filter((i) => i.state === s).length;
  const totals = {
    scheduled: insts.length,
    notStarted: count("none"),
    startedNotFinished: count("partial"),
    concluded: count("done"),
    completionRate: insts.length ? Math.round((count("done") / insts.length) * 100) : null,
  };

  const ranking: RankingRow[] = people
    .map((p) => {
      const mine = insts.filter((i) => i.userId === p.id);
      const concluded = mine.filter((i) => i.state === "done").length;
      const punctuality = avg(mine.map((i) => i.p));
      const effort = avg(mine.map((i) => i.e));
      const quality = avg(mine.map((i) => i.q));
      return {
        userId: p.id,
        name: p.name,
        unitName: p.unitName,
        expected: mine.length,
        concluded,
        completionRate: mine.length ? Math.round((concluded / mine.length) * 100) : 0,
        punctuality,
        effort,
        quality,
        overall: avg([punctuality, effort, quality]),
      };
    })
    .filter((r) => r.expected > 0)
    .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1) || b.completionRate - a.completionRate);

  const evolution: DayPoint[] = days.map((date) => {
    const d = insts.filter((i) => i.date === date);
    const concluded = d.filter((i) => i.state === "done").length;
    return {
      date,
      expected: d.length,
      concluded,
      completionRate: d.length ? Math.round((concluded / d.length) * 100) : null,
      punctuality: avg(d.map((i) => i.p)),
      effort: avg(d.map((i) => i.e)),
      quality: avg(d.map((i) => i.q)),
    };
  });

  return { totals, ranking, evolution };
}

export type Atraso = { typeName: string; userName: string; unitName: string | null; deadlineTime: string; answered: number; total: number; minutesLate: number };

/** Checklists diários de hoje cujo horário-limite já passou e que não foram
 * concluídos (não iniciados ou pela metade), do mais atrasado ao menos. */
export async function getAtrasosHoje(organizationId: number, unitId: number | null): Promise<Atraso[]> {
  const today = checklistDayISO();
  const insts = await loadInstances(organizationId, today, today, unitId, null);
  const nowMin = minutesIntoChecklistDay(new Date());
  return insts
    .filter((i) => i.state !== "done" && i.deadlineTime && deadlineMinutes(i.deadlineTime) < nowMin)
    .map((i) => ({
      typeName: i.typeName,
      userName: i.userName,
      unitName: i.unitName,
      deadlineTime: i.deadlineTime!,
      answered: i.answered,
      total: i.total,
      minutesLate: nowMin - deadlineMinutes(i.deadlineTime!),
    }))
    .sort((a, b) => b.minutesLate - a.minutesLate);
}
