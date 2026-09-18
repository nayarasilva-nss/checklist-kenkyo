import "server-only";
import { isGestorProfile } from "@/lib/auth/profile";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { utensilBreakageRecords, units, users } from "@/lib/db/schema";

export type UtensilBreakageViewer = {
  profile: string;
  jobFunctionName: string | null;
};

export function canSubmitUtensilBreakage(viewer: UtensilBreakageViewer) {
  return isGestorProfile(viewer.profile) || viewer.jobFunctionName === "Líder de Bar";
}

export async function getUtensilBreakageRecords(unitId: number | null, organizationId: number) {
  const rows = await db
    .select({
      id: utensilBreakageRecords.id,
      date: utensilBreakageRecords.date,
      item: utensilBreakageRecords.item,
      quantidade: utensilBreakageRecords.quantidade,
      motivo: utensilBreakageRecords.motivo,
      unitName: units.name,
      userName: users.name,
    })
    .from(utensilBreakageRecords)
    .innerJoin(units, eq(units.id, utensilBreakageRecords.unitId))
    .innerJoin(users, eq(users.id, utensilBreakageRecords.userId))
    .where(
      and(
        eq(utensilBreakageRecords.organizationId, organizationId),
        unitId !== null ? eq(utensilBreakageRecords.unitId, unitId) : undefined,
      ),
    )
    .orderBy(desc(utensilBreakageRecords.date), desc(utensilBreakageRecords.id))
    .limit(200);

  return rows;
}

export async function getUtensilBreakageMonthlySummary(
  unitId: number | null,
  organizationId: number,
  date?: string,
) {
  const unitFilter = unitId !== null ? sql`and unit_id = ${unitId}` : sql``;
  const monthOf = date ? sql`${date}::date` : sql`current_date`;
  const result = await db.execute<{ total: string | null; top_item: string | null }>(sql`
    select
      sum(quantidade)::text as total,
      (
        select item from utensil_breakage_records
        where date_trunc('month', date) = date_trunc('month', ${monthOf})
        and organization_id = ${organizationId}
        ${unitFilter}
        group by item
        order by sum(quantidade) desc
        limit 1
      ) as top_item
    from utensil_breakage_records
    where date_trunc('month', date) = date_trunc('month', ${monthOf})
    and organization_id = ${organizationId}
    ${unitFilter}
  `);
  const row = result.rows[0];
  return {
    totalQuebrado: row?.total != null ? Number(row.total) : 0,
    itemMaisQuebrado: row?.top_item ?? null,
  };
}
