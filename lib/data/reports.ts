import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function getDayReport(date: string, unitId: number | null) {
  const unitFilter = unitId ? sql`and u.unit_id = ${unitId}` : sql``;

  const result = await db.execute<{ name: string; count: string }>(sql`
    select u.name as name, count(*)::text as count
    from checklist_completions cc
    join users u on u.id = cc.user_id
    where cc.status = 'conforme' and cc.date = ${date}
    ${unitFilter}
    group by u.name
    order by count(*) desc
  `);
  return result.rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}

export async function getWeekReport(date: string, unitId: number | null) {
  const unitFilter = unitId ? sql`and u.unit_id = ${unitId}` : sql``;

  const result = await db.execute<{ name: string; count: string }>(sql`
    select u.name as name, count(*)::text as count
    from checklist_completions cc
    join users u on u.id = cc.user_id
    where cc.status = 'conforme'
      and date_trunc('week', cc.date::timestamp) = date_trunc('week', ${date}::timestamp)
    ${unitFilter}
    group by u.name
    order by count(*) desc
  `);
  return result.rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}
