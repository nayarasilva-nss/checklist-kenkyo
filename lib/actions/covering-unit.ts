"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { canCoverOtherUnits, setCoveringUnit, clearCoveringUnit } from "@/lib/auth/covering-unit";
import { db } from "@/lib/db";
import { units } from "@/lib/db/schema";

export async function updateCoveringUnit(formData: FormData) {
  const user = await getCurrentUser();
  if (!canCoverOtherUnits(user)) return;

  const unitId = Number(formData.get("unitId"));

  // Choosing your own unit again is just "stop covering".
  if (!unitId || unitId === user.unitId) {
    await clearCoveringUnit();
    revalidatePath("/", "layout");
    return;
  }

  const [unit] = await db.select().from(units).where(eq(units.id, unitId)).limit(1);
  if (!unit) return;

  await setCoveringUnit(unit.id, unit.name);
  revalidatePath("/", "layout");
}
