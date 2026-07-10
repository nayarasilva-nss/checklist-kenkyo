import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardStats() {
  const today = todayISO();

  const totalResult = await db.execute<{ count: string }>(
    sql`select count(*)::text as count from checklist_types`,
  );
  const totalChecklists = Number(totalResult.rows[0]?.count ?? 0);

  const completedTodayResult = await db.execute<{ count: string }>(sql`
    select count(*)::text as count
    from (
      select cti.checklist_type_id
      from checklist_type_items cti
      left join checklist_completions cc
        on cc.item_id = cti.id
        and cc.date = ${today}
        and cc.status != 'pending'
      group by cti.checklist_type_id
      having count(cti.id) = count(cc.id) and count(cti.id) > 0
    ) as done
  `);
  const completedToday = Number(completedTodayResult.rows[0]?.count ?? 0);

  const complianceResult = await db.execute<{
    conforme: string;
    total: string;
  }>(sql`
    select
      count(*) filter (where status = 'conforme')::text as conforme,
      count(*) filter (where status in ('conforme', 'nao-conforme'))::text as total
    from checklist_completions
    where date_trunc('month', date) = date_trunc('month', current_date)
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

export async function getRanking() {
  const result = await db.execute<{
    name: string;
    completions: string;
    conforme: string;
    total: string;
  }>(sql`
    select
      u.name as name,
      count(*) filter (where cc.status = 'conforme')::text as completions,
      count(*) filter (where cc.status = 'conforme')::text as conforme,
      count(*) filter (where cc.status in ('conforme', 'nao-conforme'))::text as total
    from users u
    join checklist_completions cc on cc.user_id = u.id
    group by u.id, u.name
    having count(*) filter (where cc.status = 'conforme') > 0
    order by completions desc
    limit 20
  `);

  return result.rows.map((row) => {
    const conforme = Number(row.conforme);
    const total = Number(row.total);
    return {
      name: row.name,
      completions: Number(row.completions),
      complianceRate: total > 0 ? Math.round((conforme / total) * 100) : 0,
    };
  });
}
