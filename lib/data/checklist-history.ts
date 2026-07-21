import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { checklistCompletions, checklistTypeItems } from "@/lib/db/schema";

export type ChecklistHistorySummary = {
  checklistTypeId: number;
  checklistName: string;
  userId: number;
  userName: string;
  unitName: string | null;
  date: string;
  completedItems: number;
  totalItems: number;
  lastCompletedAt: Date | null;
};

export type ChecklistHistoryItem = {
  label: string;
  status: string;
  justification: string | null;
  photoUrl: string | null;
};

export async function getChecklistHistorySummary(unitId: number | null, limit = 100) {
  const unitFilter = unitId ? sql`and u.unit_id = ${unitId}` : sql``;

  const result = await db.execute<{
    checklist_type_id: number;
    checklist_name: string;
    user_id: number;
    user_name: string;
    unit_name: string | null;
    date: string;
    completed_items: string;
    total_items: string;
    last_completed_at: string | null;
  }>(sql`
    select
      cc.checklist_type_id,
      ct.name as checklist_name,
      cc.user_id,
      u.name as user_name,
      un.name as unit_name,
      cc.date::text as date,
      count(*) filter (where cc.status != 'pending')::text as completed_items,
      (select count(*) from checklist_type_items cti where cti.checklist_type_id = cc.checklist_type_id)::text as total_items,
      max(cc.completed_at) as last_completed_at
    from checklist_completions cc
    join checklist_types ct on ct.id = cc.checklist_type_id
    join users u on u.id = cc.user_id
    left join units un on un.id = u.unit_id
    where true ${unitFilter}
    group by cc.checklist_type_id, ct.name, cc.user_id, u.name, un.name, cc.date
    order by cc.date desc, last_completed_at desc
    limit ${limit}
  `);

  return result.rows.map((r) => ({
    checklistTypeId: r.checklist_type_id,
    checklistName: r.checklist_name,
    userId: r.user_id,
    userName: r.user_name,
    unitName: r.unit_name,
    date: r.date,
    completedItems: Number(r.completed_items),
    totalItems: Number(r.total_items),
    lastCompletedAt: r.last_completed_at ? new Date(r.last_completed_at) : null,
  })) satisfies ChecklistHistorySummary[];
}

export async function getChecklistHistoryItems(
  combos: { checklistTypeId: number; userId: number; date: string }[],
) {
  const map = new Map<string, ChecklistHistoryItem[]>();
  if (combos.length === 0) return map;

  const checklistTypeIds = [...new Set(combos.map((c) => c.checklistTypeId))];
  const userIds = [...new Set(combos.map((c) => c.userId))];
  const dates = [...new Set(combos.map((c) => c.date))];

  const rows = await db
    .select({
      checklistTypeId: checklistCompletions.checklistTypeId,
      userId: checklistCompletions.userId,
      date: checklistCompletions.date,
      label: checklistTypeItems.label,
      status: checklistCompletions.status,
      justification: checklistCompletions.justification,
      photoUrl: checklistCompletions.photoUrl,
    })
    .from(checklistCompletions)
    .innerJoin(checklistTypeItems, eq(checklistTypeItems.id, checklistCompletions.itemId))
    .where(
      and(
        inArray(checklistCompletions.checklistTypeId, checklistTypeIds),
        inArray(checklistCompletions.userId, userIds),
        inArray(checklistCompletions.date, dates),
      ),
    )
    .orderBy(asc(checklistTypeItems.position));

  for (const row of rows) {
    const key = `${row.checklistTypeId}-${row.userId}-${row.date}`;
    const list = map.get(key) ?? [];
    list.push({
      label: row.label,
      status: row.status,
      justification: row.justification,
      photoUrl: row.photoUrl,
    });
    map.set(key, list);
  }

  return map;
}
