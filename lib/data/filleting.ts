import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { filletingRecords, units, users } from "@/lib/db/schema";

export type FilletingViewer = {
  profile: string;
  unitId: number | null;
  jobFunctionName: string | null;
};

export function canSubmitFilleting(viewer: FilletingViewer) {
  return viewer.profile === "gestor" || viewer.jobFunctionName === "Chefe";
}

export async function getFilletingRecords(unitId: number | null) {
  const rows = await db
    .select({
      id: filletingRecords.id,
      date: filletingRecords.date,
      responsavel: filletingRecords.responsavel,
      fishType: filletingRecords.fishType,
      recebidoKg: filletingRecords.recebidoKg,
      fileKg: filletingRecords.fileKg,
      pontaClaraKg: filletingRecords.pontaClaraKg,
      pontaEscuraKg: filletingRecords.pontaEscuraKg,
      pelesKg: filletingRecords.pelesKg,
      raspasKg: filletingRecords.raspasKg,
      unitName: units.name,
      userName: users.name,
    })
    .from(filletingRecords)
    .innerJoin(units, eq(units.id, filletingRecords.unitId))
    .innerJoin(users, eq(users.id, filletingRecords.userId))
    .where(unitId !== null ? eq(filletingRecords.unitId, unitId) : undefined)
    .orderBy(desc(filletingRecords.date), desc(filletingRecords.id))
    .limit(200);

  return rows.map((row) => {
    const recebido = Number(row.recebidoKg);
    const perdaKg =
      recebido -
      Number(row.fileKg) -
      Number(row.pontaClaraKg) -
      Number(row.pontaEscuraKg) -
      Number(row.pelesKg) -
      Number(row.raspasKg);
    const perdaPercent = recebido > 0 ? (perdaKg / recebido) * 100 : 0;

    return {
      ...row,
      recebidoKg: recebido,
      fileKg: Number(row.fileKg),
      pontaClaraKg: Number(row.pontaClaraKg),
      pontaEscuraKg: Number(row.pontaEscuraKg),
      pelesKg: Number(row.pelesKg),
      raspasKg: Number(row.raspasKg),
      perdaKg,
      perdaPercent,
    };
  });
}

export async function getFilletingMonthlySummary(unitId: number | null) {
  const unitFilter = unitId !== null ? sql`and unit_id = ${unitId}` : sql``;
  const result = await db.execute<{ avg_loss: string | null }>(sql`
    select avg(
      (recebido_kg - file_kg - ponta_clara_kg - ponta_escura_kg - peles_kg - raspas_kg)
      / nullif(recebido_kg, 0) * 100
    )::text as avg_loss
    from filleting_records
    where date_trunc('month', date) = date_trunc('month', current_date)
    ${unitFilter}
  `);
  const raw = result.rows[0]?.avg_loss;
  return { avgLossPercent: raw != null ? Number(raw) : null };
}
