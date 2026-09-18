import "server-only";
import { isGestorProfile } from "@/lib/auth/profile";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryErrorRecords, units, users } from "@/lib/db/schema";

export type DeliveryErrorViewer = {
  profile: string;
  jobFunctionName: string | null;
};

export function canSubmitDeliveryError(viewer: DeliveryErrorViewer) {
  return isGestorProfile(viewer.profile) || viewer.jobFunctionName === "Líder de Delivery";
}

export async function getDeliveryErrorRecords(unitId: number | null) {
  const rows = await db
    .select({
      id: deliveryErrorRecords.id,
      date: deliveryErrorRecords.date,
      totalPedidos: deliveryErrorRecords.totalPedidos,
      pedidosComErro: deliveryErrorRecords.pedidosComErro,
      motivo: deliveryErrorRecords.motivo,
      unitName: units.name,
      userName: users.name,
    })
    .from(deliveryErrorRecords)
    .innerJoin(units, eq(units.id, deliveryErrorRecords.unitId))
    .innerJoin(users, eq(users.id, deliveryErrorRecords.userId))
    .where(unitId !== null ? eq(deliveryErrorRecords.unitId, unitId) : undefined)
    .orderBy(desc(deliveryErrorRecords.date), desc(deliveryErrorRecords.id))
    .limit(200);

  return rows.map((row) => ({
    ...row,
    errorPercent: row.totalPedidos > 0 ? (row.pedidosComErro / row.totalPedidos) * 100 : 0,
  }));
}

export async function getDeliveryErrorMonthlySummary(unitId: number | null, date?: string) {
  const unitFilter = unitId !== null ? sql`and unit_id = ${unitId}` : sql``;
  const monthOf = date ? sql`${date}::date` : sql`current_date`;
  const result = await db.execute<{ error_rate: string | null }>(sql`
    select (sum(pedidos_com_erro)::float / nullif(sum(total_pedidos), 0) * 100)::text as error_rate
    from delivery_error_records
    where date_trunc('month', date) = date_trunc('month', ${monthOf})
    ${unitFilter}
  `);
  const raw = result.rows[0]?.error_rate;
  return { errorRatePercent: raw != null ? Number(raw) : null };
}
