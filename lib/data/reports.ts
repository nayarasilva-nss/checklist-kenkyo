import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// A checklist counts as completed once every item has been evaluated
// (status != 'pending') — a "não conforme" item still completes the
// checklist, it just also gets flagged as an anomaly elsewhere. Counting
// only 'conforme' rows here would undercount checklists that had any
// non-compliant item, which is the bug this query used to have.
export async function getDayReport(
  date: string,
  unitId: number | null,
  jobFunctionId: number | null = null,
) {
  const unitFilter = unitId ? sql`and u.unit_id = ${unitId}` : sql``;
  const funcFilter = jobFunctionId ? sql`and u.job_function_id = ${jobFunctionId}` : sql``;

  const result = await db.execute<{ name: string; count: string }>(sql`
    with completed_sessions as (
      select cc.user_id, cc.checklist_type_id
      from checklist_completions cc
      where cc.status != 'pending' and cc.date = ${date}
      group by cc.user_id, cc.checklist_type_id, cc.date
      having count(distinct cc.item_id) = (
        select count(*) from checklist_type_items cti
        where cti.checklist_type_id = cc.checklist_type_id
      )
    )
    select u.name as name, count(*)::text as count
    from completed_sessions cs
    join users u on u.id = cs.user_id
    where true ${unitFilter} ${funcFilter}
    group by u.name
    order by count(*) desc
  `);
  return result.rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}

/** Same "completed checklist session" definition as getDayReport, over an
 * inclusive [fromDate, toDate] range instead of a single day. */
export async function getPeriodReport(
  fromDate: string,
  toDate: string,
  unitId: number | null,
  jobFunctionId: number | null = null,
) {
  const unitFilter = unitId ? sql`and u.unit_id = ${unitId}` : sql``;
  const funcFilter = jobFunctionId ? sql`and u.job_function_id = ${jobFunctionId}` : sql``;

  const result = await db.execute<{ name: string; count: string }>(sql`
    with completed_sessions as (
      select cc.user_id, cc.checklist_type_id
      from checklist_completions cc
      where cc.status != 'pending'
        and cc.date >= ${fromDate} and cc.date <= ${toDate}
      group by cc.user_id, cc.checklist_type_id, cc.date
      having count(distinct cc.item_id) = (
        select count(*) from checklist_type_items cti
        where cti.checklist_type_id = cc.checklist_type_id
      )
    )
    select u.name as name, count(*)::text as count
    from completed_sessions cs
    join users u on u.id = cs.user_id
    where true ${unitFilter} ${funcFilter}
    group by u.name
    order by count(*) desc
  `);
  return result.rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}
