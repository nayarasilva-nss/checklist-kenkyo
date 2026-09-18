"use server";

import { isGestorProfile } from "@/lib/auth/profile";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { setGestorFuncao, clearGestorFuncao } from "@/lib/auth/gestor-funcao";
import { db } from "@/lib/db";
import { jobFunctions } from "@/lib/db/schema";

export async function updateGestorFuncao(formData: FormData) {
  const user = await getCurrentUser();
  if (!isGestorProfile(user.profile)) return;

  const jobFunctionId = Number(formData.get("jobFunctionId"));

  if (!jobFunctionId) {
    await clearGestorFuncao();
    revalidatePath("/", "layout");
    return;
  }

  const [jobFunction] = await db
    .select()
    .from(jobFunctions)
    .where(eq(jobFunctions.id, jobFunctionId))
    .limit(1);
  if (!jobFunction) return;

  await setGestorFuncao(jobFunction.id, jobFunction.name);
  revalidatePath("/", "layout");
}
