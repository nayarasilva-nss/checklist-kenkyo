import "server-only";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { anomalies, restoIngestaRecords, units } from "@/lib/db/schema";
import { chamarErp, erpConfigurado } from "./integracao";

/**
 * As anomalias viram "ocorrências operacionais" no ERP (POST /api/ocorrencias), para o acompanhamento da semana.
 * Vai só o que serve lá: data, loja (CNPJ da ligação com o ERP), tipos, setores, o que aconteceu, a ação e a situação —
 * quem relatou e os colaboradores envolvidos ficam aqui. Nada aqui depende do ERP: o que não foi fica com
 * erpEnviadaEm nulo e vai na próxima (enviarOcorrenciasPendentes).
 */
export async function enviarOcorrenciaAoErp(id: number): Promise<boolean> {
  if (!erpConfigurado()) return false;
  const [a] = await db
    .select({
      id: anomalies.id, date: anomalies.date, tipos: anomalies.tipos, setores: anomalies.setores,
      oQueAconteceu: anomalies.oQueAconteceu, acaoTomada: anomalies.acaoTomada, status: anomalies.status, cnpj: units.erpCnpj,
    })
    .from(anomalies)
    .innerJoin(units, eq(units.id, anomalies.unitId))
    .where(eq(anomalies.id, id))
    .limit(1);
  if (!a?.cnpj) return false;
  try {
    const resposta = await chamarErp("/api/ocorrencias", {
      method: "POST",
      body: JSON.stringify({
        id_externo: String(a.id), unidade_cnpj: a.cnpj, data: a.date, tipos: a.tipos, setores: a.setores,
        o_que_aconteceu: a.oQueAconteceu, acao_tomada: a.acaoTomada, status: a.status,
      }),
    });
    if (!resposta.ok) return false;
    await db.update(anomalies).set({ erpEnviadaEm: new Date() }).where(eq(anomalies.id, a.id));
    return true;
  } catch {
    return false;
  }
}

/** A anomalia apagada aqui sai do ERP também. */
export async function excluirOcorrenciaNoErp(id: number): Promise<void> {
  if (!erpConfigurado()) return;
  try {
    await chamarErp("/api/ocorrencias", { method: "POST", body: JSON.stringify({ id_externo: String(id), excluida: true }) });
  } catch {
    // fora do ar: a ocorrência fica no ERP até alguém apagar lá
  }
}

/** O que ainda não chegou ao ERP (as mais recentes primeiro), só de lojas ligadas a um CNPJ. */
export async function enviarOcorrenciasPendentes(organizationId: number, limite = 50): Promise<number> {
  if (!erpConfigurado()) return 0;
  const pendentes = await db
    .select({ id: anomalies.id })
    .from(anomalies)
    .innerJoin(units, eq(units.id, anomalies.unitId))
    .where(and(eq(anomalies.organizationId, organizationId), isNull(anomalies.erpEnviadaEm), isNotNull(units.erpCnpj)))
    .orderBy(desc(anomalies.date))
    .limit(limite);
  let enviadas = 0;
  for (const p of pendentes) if (await enviarOcorrenciaAoErp(p.id)) enviadas++;
  return enviadas;
}

/**
 * O resto ingestão do dia (experiências vendidas e desperdício em kg) vai para o acompanhamento da semana do ERP
 * (POST /api/resto-ingestao), do mesmo jeito: o que não foi fica com erpEnviadoEm nulo e vai na próxima.
 */
export async function enviarRestoAoErp(id: number): Promise<boolean> {
  if (!erpConfigurado()) return false;
  const [r] = await db
    .select({ id: restoIngestaRecords.id, date: restoIngestaRecords.date, experiencias: restoIngestaRecords.experienciasVendidas,
      kg: restoIngestaRecords.desperdicioKg, cnpj: units.erpCnpj })
    .from(restoIngestaRecords)
    .innerJoin(units, eq(units.id, restoIngestaRecords.unitId))
    .where(eq(restoIngestaRecords.id, id))
    .limit(1);
  if (!r?.cnpj) return false;
  try {
    const resposta = await chamarErp("/api/resto-ingestao", {
      method: "POST",
      body: JSON.stringify({ id_externo: String(r.id), unidade_cnpj: r.cnpj, data: r.date, experiencias_vendidas: r.experiencias, desperdicio_kg: r.kg }),
    });
    if (!resposta.ok) return false;
    await db.update(restoIngestaRecords).set({ erpEnviadoEm: new Date() }).where(eq(restoIngestaRecords.id, r.id));
    return true;
  } catch {
    return false;
  }
}

export async function excluirRestoNoErp(id: number): Promise<void> {
  if (!erpConfigurado()) return;
  try {
    await chamarErp("/api/resto-ingestao", { method: "POST", body: JSON.stringify({ id_externo: String(id), excluida: true }) });
  } catch {
    // fora do ar: o registro fica no ERP até alguém apagar lá
  }
}

/** Ocorrências e resto ingestão que ainda não chegaram ao ERP. */
export async function enviarAcompanhamentoPendente(organizationId: number, limite = 50): Promise<number> {
  let enviados = await enviarOcorrenciasPendentes(organizationId, limite);
  if (!erpConfigurado()) return enviados;
  const pendentes = await db
    .select({ id: restoIngestaRecords.id })
    .from(restoIngestaRecords)
    .innerJoin(units, eq(units.id, restoIngestaRecords.unitId))
    .where(and(eq(restoIngestaRecords.organizationId, organizationId), isNull(restoIngestaRecords.erpEnviadoEm), isNotNull(units.erpCnpj)))
    .orderBy(desc(restoIngestaRecords.date))
    .limit(limite);
  for (const p of pendentes) if (await enviarRestoAoErp(p.id)) enviados++;
  return enviados;
}
