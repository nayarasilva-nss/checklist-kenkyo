import "server-only";
import { desc, eq } from "drizzle-orm";
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
