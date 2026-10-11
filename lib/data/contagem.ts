import "server-only";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { isGestorProfile } from "@/lib/auth/profile";
import { db } from "@/lib/db";
import { jobFunctions, units } from "@/lib/db/schema";

type Viewer = { id: number; profile: string; unitId: number | null; jobFunctionId: number | null; jobFunctionName: string | null; organizationId: number | null };

/** As unidades ligadas ao ERP (com CNPJ) que a pessoa pode contar: gestor, todas; os demais, a do dia. */
export async function unidadesParaContagem(user: Viewer) {
  if (!user.organizationId) return [];
  const ligadas = await db.select({ id: units.id, name: units.name, cnpj: units.erpCnpj }).from(units)
    .where(and(eq(units.organizationId, user.organizationId), isNotNull(units.erpCnpj))).orderBy(asc(units.name));
  if (isGestorProfile(user.profile)) return ligadas.map((u) => ({ ...u, cnpj: u.cnpj! }));
  const efetiva = await resolveEffectiveUnitId(user);
  return ligadas.filter((u) => u.id === efetiva).map((u) => ({ ...u, cnpj: u.cnpj! }));
}

/** A unidade escolhida (?unidade=) entre as permitidas; sem escolha, a primeira. */
export async function unidadeDaContagem(user: Viewer, escolhida?: number | null) {
  const lista = await unidadesParaContagem(user);
  return { lista, unidade: lista.find((u) => u.id === escolhida) ?? lista[0] ?? null };
}

/** O setor do ERP da função de quem conta (líder vê só os itens dele; o resto vê tudo). */
export async function setorDeQuemConta(user: Viewer): Promise<string | null> {
  if (user.profile !== "lider" || !user.jobFunctionId) return null;
  const f = await db.select({ setor: jobFunctions.erpSetor }).from(jobFunctions).where(eq(jobFunctions.id, user.jobFunctionId)).limit(1);
  return f[0]?.setor ?? null;
}
