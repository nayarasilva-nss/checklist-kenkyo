import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogItems, jobFunctions, requisicaoItens, requisicoes, units, users } from "@/lib/db/schema";
import { checklistDayForInstant } from "@/lib/date-utils";
import type { ItemErp } from "./sugestao";

/**
 * Ligação com o ERP Kenkyo. A requisição acompanha lá a fase daqui
 * (POST /api/requisicoes com "situacao"): lançada ou editada entra como
 * aberta; conferida vira a baixa de estoque, pelo custo médio; cancelada ou
 * excluída é cancelada lá. Nada aqui depende do ERP: se ele estiver fora do
 * ar, a requisição fica "pendente" e vai na próxima vez.
 *
 * Configuração (variáveis de ambiente): ERP_API_URL (ex.:
 * https://erp-kenkyo.vercel.app) e ERP_API_TOKEN (o mesmo valor de
 * API_REQUISICOES_TOKEN no ERP). Sem as duas, nada é enviado.
 */

export type ErpCatalogo = {
  itens: ItemErp[];
  setores?: string[];
  unidades: { cnpj: string; nome: string; tipo: string }[];
  locais: { id: number; nome: string; tipo: string; unidade_cnpj: string; unidade: string }[];
};

export function erpConfigurado(): boolean {
  return Boolean(process.env.ERP_API_URL && process.env.ERP_API_TOKEN);
}

async function chamarErp(caminho: string, init?: RequestInit): Promise<Response> {
  const base = (process.env.ERP_API_URL ?? "").replace(/\/+$/, "");
  return fetch(`${base}${caminho}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${process.env.ERP_API_TOKEN ?? ""}`, "Content-Type": "application/json" },
  });
}

/** Itens, empresas e locais de estoque do ERP, para a tela de ligação. */
export async function lerCatalogoErp(): Promise<ErpCatalogo> {
  if (!erpConfigurado()) throw new Error("A ligação com o ERP não está configurada (faltam ERP_API_URL e ERP_API_TOKEN).");
  let resposta: Response;
  try {
    resposta = await chamarErp("/api/catalogo");
  } catch {
    throw new Error("Não foi possível falar com o ERP agora. Tente de novo em instantes.");
  }
  if (resposta.status === 401) throw new Error("O ERP recusou a chave da ligação (ERP_API_TOKEN diferente do API_REQUISICOES_TOKEN do ERP).");
  if (!resposta.ok) throw new Error(`O ERP respondeu com erro ${resposta.status}.`);
  return (await resposta.json()) as ErpCatalogo;
}

/**
 * Os setores que pedem cada item do ERP (código → setores), para a tela de
 * requisição mostrar a cada função só o que é do setor dela. Guardado em
 * cache por 5 minutos e com tempo curto: se o ERP não responder, devolve
 * null e a requisição mostra o catálogo inteiro — nunca trava o pedido.
 */
export async function setoresDosItensErp(): Promise<Map<string, string[]> | null> {
  if (!erpConfigurado()) return null;
  try {
    const base = (process.env.ERP_API_URL ?? "").replace(/\/+$/, "");
    const resposta = await fetch(`${base}/api/catalogo`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5_000),
      headers: { Authorization: `Bearer ${process.env.ERP_API_TOKEN ?? ""}` },
    });
    if (!resposta.ok) return null;
    const catalogo = (await resposta.json()) as ErpCatalogo;
    return new Map(catalogo.itens.map((i) => [i.codigo, i.setores ?? []]));
  } catch {
    return null;
  }
}

/**
 * O filtro da requisição: com setor, fica o produto que o ERP marca para o
 * setor, o que o ERP não marcou para nenhum, e o que não está ligado ao ERP.
 */
export function produtoDoSetor(erpItemCodigo: string | null, setor: string, setores: Map<string, string[]>): boolean {
  if (!erpItemCodigo) return true;
  const doItem = setores.get(erpItemCodigo);
  return !doItem || doItem.length === 0 || doItem.includes(setor);
}

const MEDIDA: Record<string, [string, number]> = { kg: ["massa", 1], g: ["massa", 0.001], L: ["volume", 1], ml: ["volume", 0.001] };

/** Quanto de "para" vem em 1 de "de" (g → kg = 0,001); null se não converte. */
export function converterMedida(de: string, para: string | null): number | null {
  if (!para || de === para) return 1;
  const a = MEDIDA[de], b = MEDIDA[para];
  return a && b && a[0] === b[0] ? a[1] / b[1] : null;
}

export type ResultadoEnvio = { status: "enviada" | "aguardando" | "pendente" | "erro"; mensagem: string | null; numero: string | null };

async function gravar(id: number, r: ResultadoEnvio) {
  await db
    .update(requisicoes)
    .set({
      erpStatus: r.status,
      erpMensagem: r.mensagem,
      erpNumero: r.numero,
      erpEnviadoEm: r.status === "enviada" ? new Date() : null,
    })
    .where(eq(requisicoes.id, id));
  return r;
}

/** Cancela no ERP (requisição cancelada ou excluída aqui). */
async function cancelarNoErp(requisicaoId: number): Promise<ResultadoEnvio> {
  let resposta: Response;
  try {
    resposta = await chamarErp("/api/requisicoes", {
      method: "POST",
      body: JSON.stringify({ id_externo: `checklist-${requisicaoId}`, situacao: "cancelada" }),
    });
  } catch {
    return { status: "pendente", mensagem: "O ERP não respondeu. Vai de novo na próxima tentativa.", numero: null };
  }
  const dados = (await resposta.json().catch(() => ({}))) as { numero?: string; erros?: string[]; erro?: string };
  if (resposta.ok) return { status: "enviada", mensagem: null, numero: dados.numero ?? null };
  if (resposta.status === 401 || resposta.status === 503) {
    return { status: "pendente", mensagem: dados.erro ?? "O ERP recusou a chave da ligação.", numero: null };
  }
  return { status: "erro", mensagem: (dados.erros ?? [dados.erro ?? `O ERP respondeu com erro ${resposta.status}.`]).join(" "), numero: null };
}

/** A requisição foi excluída aqui: cancela a aberta no ERP (não há mais onde gravar o resultado). */
export async function cancelarExcluidaNoErp(requisicaoId: number): Promise<void> {
  if (!erpConfigurado()) return;
  const r = await cancelarNoErp(requisicaoId);
  if (r.status !== "enviada") console.error(`Requisição ${requisicaoId} excluída, mas o ERP não cancelou: ${r.mensagem}`);
}

/**
 * Leva ao ERP a fase atual da requisição (aberta, conferida ou cancelada) e
 * grava o resultado nela. Nunca lança: o que der errado vira status e
 * mensagem para o gestor ver em Gerenciar › ERP. O ERP reconhece a mesma
 * requisição pelo id: mandar de novo não duplica nem baixa duas vezes.
 */
export async function enviarRequisicaoAoErp(requisicaoId: number): Promise<ResultadoEnvio> {
  const [req] = await db
    .select({
      id: requisicoes.id,
      tipo: requisicoes.tipo,
      status: requisicoes.status,
      erpStatus: requisicoes.erpStatus,
      observacao: requisicoes.observacao,
      createdAt: requisicoes.createdAt,
      concluidoEm: requisicoes.concluidoEm,
      unitName: units.name,
      erpCnpj: units.erpCnpj,
      setor: jobFunctions.name,
    })
    .from(requisicoes)
    .innerJoin(units, eq(units.id, requisicoes.unitId))
    .innerJoin(users, eq(users.id, requisicoes.requesterId))
    .leftJoin(jobFunctions, eq(jobFunctions.id, users.jobFunctionId))
    .where(eq(requisicoes.id, requisicaoId))
    .limit(1);
  if (!req) return { status: "erro", mensagem: "Requisição não encontrada.", numero: null };
  if (!erpConfigurado()) return gravar(req.id, { status: "pendente", mensagem: "A ligação com o ERP ainda não está configurada.", numero: null });
  if (req.status === "cancelada") return gravar(req.id, await cancelarNoErp(req.id));
  const conferida = req.status === "conferida";

  if (!req.erpCnpj) {
    return gravar(req.id, { status: "aguardando", mensagem: `A unidade ${req.unitName} ainda não está ligada a uma empresa do ERP.`, numero: null });
  }

  const itens = await db
    .select({
      nome: requisicaoItens.nome,
      catalogItemId: requisicaoItens.catalogItemId,
      qtdPedida: requisicaoItens.qtdPedida,
      qtdConferida: requisicaoItens.qtdConferida,
      unidadePedida: requisicaoItens.unidadeMedida,
      unidadeProduto: catalogItems.unitMeasure,
      erpItemCodigo: catalogItems.erpItemCodigo,
      erpFator: catalogItems.erpFator,
    })
    .from(requisicaoItens)
    .leftJoin(catalogItems, eq(catalogItems.id, requisicaoItens.catalogItemId))
    .where(eq(requisicaoItens.requisicaoId, req.id));

  // Item avulso (fora do catálogo) não tem como baixar estoque: vai como aviso.
  const avulsos = itens.filter((i) => i.catalogItemId === null).map((i) => i.nome);
  // O fator vale para a medida atual do produto; item pedido antes noutra
  // medida (o catálogo mudou depois, ex.: espelho do ERP) é convertido.
  const fatorDe = (i: (typeof itens)[number]) => {
    const conversao = converterMedida(i.unidadePedida, i.unidadeProduto);
    return conversao === null ? null : Number(i.erpFator) * conversao;
  };
  const semLigacao = itens.filter((i) => i.catalogItemId !== null && (!i.erpItemCodigo || !(Number(i.erpFator) > 0))).map((i) => i.nome);
  const outraMedida = itens.filter((i) => i.catalogItemId !== null && i.erpItemCodigo && Number(i.erpFator) > 0 && fatorDe(i) === null)
    .map((i) => `${i.nome} (pedido em ${i.unidadePedida}, produto agora em ${i.unidadeProduto})`);
  // Conferida baixa estoque: tem que ir inteira. Aberta vai com o que já está
  // ligado, para o ERP ver o pedido na hora; o resto fica no aviso.
  if (conferida && outraMedida.length > 0) {
    return gravar(req.id, { status: "aguardando", mensagem: `Medida que não dá para converter: ${outraMedida.join(", ")}.`, numero: null });
  }
  if (conferida && semLigacao.length > 0) {
    return gravar(req.id, {
      status: "aguardando",
      mensagem: `Produto sem item do ERP ligado: ${[...new Set(semLigacao)].join(", ")}.`,
      numero: null,
    });
  }

  // O ERP não aceita o mesmo item duas vezes: soma, já na unidade dele.
  const porCodigo = new Map<string, { solicitada: number; atendida: number }>();
  for (const i of itens) {
    if (!i.erpItemCodigo) continue;
    const fator = fatorDe(i);
    if (fator === null || !(Number(i.erpFator) > 0)) continue;
    const atual = porCodigo.get(i.erpItemCodigo) ?? { solicitada: 0, atendida: 0 };
    atual.solicitada += Number(i.qtdPedida) * fator;
    atual.atendida += Number(i.qtdConferida ?? i.qtdPedida) * fator;
    porCodigo.set(i.erpItemCodigo, atual);
  }
  const faltaLigar = conferida ? [] : [...new Set([...semLigacao, ...outraMedida])];
  const aviso = [
    avulsos.length > 0 ? `Itens avulsos não baixados no ERP: ${avulsos.join(", ")}.` : null,
    faltaLigar.length > 0 ? `Ainda sem item do ERP ligado (precisa ligar antes de conferir): ${faltaLigar.join(", ")}.` : null,
  ].filter(Boolean).join(" ") || null;
  if (porCodigo.size === 0) {
    return gravar(req.id, conferida
      ? { status: "enviada", mensagem: aviso ?? "Nenhum produto do catálogo: nada a baixar.", numero: null }
      : { status: "aguardando", mensagem: aviso ?? "Nenhum produto ligado ao ERP ainda.", numero: null });
  }

  const arredondar = (n: number) => Math.round(n * 10_000) / 10_000;
  const corpo = {
    id_externo: `checklist-${req.id}`,
    situacao: conferida ? "conferida" : "aberta",
    unidade_cnpj: req.erpCnpj,
    // o ERP decide o local: interna do Estoque local da unidade, externa do Estoque central do Empório
    tipo: req.tipo,
    setor: req.setor ?? undefined,
    data_solicitacao: checklistDayForInstant(req.createdAt),
    data_atendimento: conferida ? checklistDayForInstant(req.concluidoEm ?? new Date()) : checklistDayForInstant(req.createdAt),
    observacao: [`Requisição ${req.tipo} nº ${req.id} do app de checklist`, req.observacao].filter(Boolean).join(" · "),
    itens: [...porCodigo.entries()]
      .filter(([, q]) => q.solicitada > 0)
      .map(([codigo, q]) => ({ codigo, qtd_solicitada: arredondar(q.solicitada), ...(conferida ? { qtd_atendida: arredondar(q.atendida) } : {}) })),
  };

  let resposta: Response;
  try {
    resposta = await chamarErp("/api/requisicoes", { method: "POST", body: JSON.stringify(corpo) });
  } catch {
    return gravar(req.id, { status: "pendente", mensagem: "O ERP não respondeu. Vai de novo na próxima tentativa.", numero: null });
  }
  const dados = (await resposta.json().catch(() => ({}))) as { numero?: string; erros?: string[]; erro?: string };
  if (resposta.status === 201 || resposta.status === 200) {
    return gravar(req.id, { status: "enviada", mensagem: aviso, numero: dados.numero ?? null });
  }
  if (resposta.status === 401 || resposta.status === 503) {
    return gravar(req.id, { status: "pendente", mensagem: dados.erro ?? "O ERP recusou a chave da ligação.", numero: null });
  }
  return gravar(req.id, {
    status: "erro",
    mensagem: (dados.erros ?? [dados.erro ?? `O ERP respondeu com erro ${resposta.status}.`]).join(" "),
    numero: null,
  });
}

/**
 * Tenta de novo o que ficou para trás, em qualquer fase: pendente (ERP fora
 * do ar) e aguardando (faltava ligação, que pode já ter sido feita). Erro de
 * dado não volta sozinho — o gestor corrige e manda reenviar.
 */
export async function enviarPendentesAoErp(organizationId: number, limite = 20): Promise<number> {
  if (!erpConfigurado()) return 0;
  const fila = await db
    .select({ id: requisicoes.id })
    .from(requisicoes)
    .where(
      and(
        eq(requisicoes.organizationId, organizationId),
        inArray(requisicoes.erpStatus, ["pendente", "aguardando"]),
      ),
    )
    .orderBy(requisicoes.createdAt)
    .limit(limite);
  let enviadas = 0;
  for (const r of fila) {
    if ((await enviarRequisicaoAoErp(r.id)).status === "enviada") enviadas++;
  }
  return enviadas;
}
