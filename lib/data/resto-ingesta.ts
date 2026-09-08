import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { restoIngestaRecords, units, users } from "@/lib/db/schema";

export type RestoIngestaViewer = {
  profile: string;
};

export function canSubmitRestoIngesta(viewer: RestoIngestaViewer) {
  return viewer.profile === "gestor" || viewer.profile === "gerente";
}

export async function getRestoIngestaRecords(unitId: number | null) {
  const rows = await db
    .select({
      id: restoIngestaRecords.id,
      date: restoIngestaRecords.date,
      experienciasVendidas: restoIngestaRecords.experienciasVendidas,
      desperdicioKg: restoIngestaRecords.desperdicioKg,
      unitName: units.name,
      userName: users.name,
    })
    .from(restoIngestaRecords)
    .innerJoin(units, eq(units.id, restoIngestaRecords.unitId))
    .innerJoin(users, eq(users.id, restoIngestaRecords.userId))
    .where(
      unitId !== null ? eq(restoIngestaRecords.unitId, unitId) : undefined,
    )
    .orderBy(desc(restoIngestaRecords.date), desc(restoIngestaRecords.id))
    .limit(200);

  return rows.map((row) => {
    const desperdicioKg = Number(row.desperdicioKg);
    const desperdicioPorPessoaKg =
      row.experienciasVendidas > 0
        ? desperdicioKg / row.experienciasVendidas
        : 0;

    return {
      ...row,
      desperdicioKg,
      desperdicioPorPessoaKg,
    };
  });
}

export async function getRestoIngestaMonthlySummary(unitId: number | null, date?: string) {
  const unitFilter = unitId !== null ? sql`and unit_id = ${unitId}` : sql``;
  const monthOf = date ? sql`${date}::date` : sql`current_date`;
  const result = await db.execute<{ avg_waste: string | null }>(sql`
    select avg(desperdicio_kg / nullif(experiencias_vendidas, 0))::text as avg_waste
    from resto_ingesta_records
    where date_trunc('month', date) = date_trunc('month', ${monthOf})
    ${unitFilter}
  `);
  const raw = result.rows[0]?.avg_waste;
  return { avgWastePerPersonKg: raw != null ? Number(raw) : null };
}
