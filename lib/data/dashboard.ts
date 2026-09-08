import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { checklistCompletions, checklistTypes, units, users } from "@/lib/db/schema";
// Checklist-derived stats use the same 02:00 BRT rollover as the
// checklist page itself (checklistDayISO), not plain midnight — otherwise
// "Concluídos Hoje" and the ranking's week boundary would disagree with
// what the Checklist page considers "today".
import { checklistDayISO as todayISO } from "@/lib/date-utils";

export async function getDashboardStats(unitId: number | null, date: string = todayISO()) {
  const today = date;

  const totalResult = await db.execute<{ count: string }>(
    sql`select count(*)::text as count from checklist_types`,
  );
  const totalChecklists = Number(totalResult.rows[0]?.count ?? 0);

  // A completion's own unit_id wins when set (covers a gerente/chefe
  // completing it while covering another unit); rows written before that
  // column existed fall back to the completing user's own unit. The
  // effective unit is computed in a subquery first, then filtered inside
  // the LEFT JOIN's own ON condition (not WHERE) — items with zero
  // completions must still show up as "not done" instead of disappearing.
  const unitCompletionFilter = unitId
    ? sql`and cc.effective_unit_id = ${unitId}`
    : sql``;

  const completedTodayResult = await db.execute<{ count: string }>(sql`
    select count(*)::text as count
    from (
      select cti.checklist_type_id
      from checklist_type_items cti
      left join (
        select cc.*, coalesce(cc.unit_id, u.unit_id) as effective_unit_id
        from checklist_completions cc
        join users u on u.id = cc.user_id
      ) cc
        on cc.item_id = cti.id
        and cc.date = ${today}
        and cc.status != 'pending'
        ${unitCompletionFilter}
      group by cti.checklist_type_id
      having count(cti.id) = count(cc.id) and count(cti.id) > 0
    ) as done
  `);
  const completedToday = Number(completedTodayResult.rows[0]?.count ?? 0);

  const complianceUnitFilter = unitId
    ? sql`and coalesce(cc.unit_id, u.unit_id) = ${unitId}`
    : sql``;

  const complianceResult = await db.execute<{
    conforme: string;
    total: string;
  }>(sql`
    select
      count(*) filter (where cc.status = 'conforme')::text as conforme,
      count(*) filter (where cc.status in ('conforme', 'nao-conforme'))::text as total
    from checklist_completions cc
    join users u on u.id = cc.user_id
    where date_trunc('month', cc.date::timestamp) = date_trunc('month', ${today}::timestamp)
    ${complianceUnitFilter}
  `);
  const conforme = Number(complianceResult.rows[0]?.conforme ?? 0);
  const totalEvaluated = Number(complianceResult.rows[0]?.total ?? 0);
  const complianceRate =
    totalEvaluated > 0 ? Math.round((conforme / totalEvaluated) * 100) : null;

  return {
    totalChecklists,
    completedToday,
    inProgress: Math.max(0, totalChecklists - completedToday),
    complianceRate,
  };
}

export async function getRanking(unitId: number | null, date: string = todayISO()) {
  // Grouped by (user, effective unit) rather than just user: a gerente/
  // chefe covering another unit that week needs their tally split between
  // their home unit and the covered one, not blended into one row that'd
  // either double-count against their home unit or vanish from the
  // covered unit's ranking entirely.
  const unitFilter = unitId ? sql`and sc.effective_unit_id = ${unitId}` : sql``;

  const result = await db.execute<{
    name: string;
    unit_name: string | null;
    completions: string;
    conforme: string;
    total: string;
  }>(sql`
    with sessions_with_unit as (
      select
        cc.user_id, cc.checklist_type_id, cc.date, cc.status, cc.item_id,
        coalesce(cc.unit_id, u.unit_id) as effective_unit_id
      from checklist_completions cc
      join users u on u.id = cc.user_id
      where date_trunc('week', cc.date::timestamp) = date_trunc('week', ${date}::timestamp)
    ),
    completed_sessions as (
      select user_id, checklist_type_id, date, effective_unit_id
      from sessions_with_unit s
      where status != 'pending'
      group by user_id, checklist_type_id, date, effective_unit_id
      having count(distinct item_id) = (
        select count(*)
        from checklist_type_items cti
        where cti.checklist_type_id = s.checklist_type_id
      )
    ),
    session_counts as (
      select user_id, effective_unit_id, count(*)::int as completions
      from completed_sessions
      group by user_id, effective_unit_id
    ),
    item_stats as (
      select
        user_id,
        effective_unit_id,
        count(*) filter (where status = 'conforme')::int as conforme,
        count(*) filter (where status in ('conforme', 'nao-conforme'))::int as total
      from sessions_with_unit
      group by user_id, effective_unit_id
    )
    select
      u.name as name,
      un.name as unit_name,
      sc.completions::text as completions,
      coalesce(ist.conforme, 0)::text as conforme,
      coalesce(ist.total, 0)::text as total
    from session_counts sc
    join users u on u.id = sc.user_id
    left join item_stats ist
      on ist.user_id = sc.user_id and ist.effective_unit_id = sc.effective_unit_id
    left join units un on un.id = sc.effective_unit_id
    where true
    ${unitFilter}
    order by sc.completions desc
    limit 20
  `);

  return result.rows.map((row) => {
    const conforme = Number(row.conforme);
    const total = Number(row.total);
    return {
      name: row.name,
      unitName: row.unit_name,
      completions: Number(row.completions),
      complianceRate: total > 0 ? Math.round((conforme / total) * 100) : 0,
    };
  });
}

export type MissingChecklistUser = {
  id: number;
  name: string;
  unitName: string | null;
};

/**
 * Gerente/líder who has at least one visible daily checklist but hasn't
 * touched a single item of it today — not "hasn't finished", just "hasn't
 * started". Someone with no daily checklist assigned at all is never
 * flagged, since there'd be nothing for them to do.
 */
export async function getUsersWithoutChecklistToday(
  unitId: number | null,
  date: string = todayISO(),
): Promise<MissingChecklistUser[]> {
  const today = date;

  const candidates = await db
    .select({
      id: users.id,
      name: users.name,
      jobFunctionId: users.jobFunctionId,
      unitName: units.name,
    })
    .from(users)
    .leftJoin(units, eq(units.id, users.unitId))
    .where(
      unitId
        ? and(inArray(users.profile, ["gerente", "lider"]), eq(users.unitId, unitId))
        : and(inArray(users.profile, ["gerente", "lider"]), sql`${users.unitId} is not null`),
    );

  if (candidates.length === 0) return [];

  const dailyTypes = await db
    .select({
      jobFunctionId: checklistTypes.jobFunctionId,
      assignedUserId: checklistTypes.assignedUserId,
    })
    .from(checklistTypes)
    .where(eq(checklistTypes.type, "daily"));

  const candidateIds = candidates.map((c) => c.id);
  const completedRows = await db
    .selectDistinct({ userId: checklistCompletions.userId })
    .from(checklistCompletions)
    .where(
      and(
        eq(checklistCompletions.date, today),
        inArray(checklistCompletions.userId, candidateIds),
      ),
    );
  const completedIds = new Set(completedRows.map((r) => r.userId));

  function hasVisibleDailyChecklist(candidate: { id: number; jobFunctionId: number | null }) {
    return dailyTypes.some(
      (t) =>
        t.assignedUserId === candidate.id ||
        (t.assignedUserId === null &&
          (t.jobFunctionId === null || t.jobFunctionId === candidate.jobFunctionId)),
    );
  }

  return candidates
    .filter((c) => !completedIds.has(c.id) && hasVisibleDailyChecklist(c))
    .map((c) => ({ id: c.id, name: c.name, unitName: c.unitName }));
}
