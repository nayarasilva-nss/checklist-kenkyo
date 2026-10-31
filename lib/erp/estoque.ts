import "server-only";
import { chamarErp, erpConfigurado, type LigacaoErp } from "./integracao";

/** O estoque de uma unidade, lido do ERP (só leitura). Quantidades e valores já vêm como número. */
export type ItemEstoque = {
  codigo: string; nome: string; categoria: string | null; curva: string; unidade_uso: string;
  quantidade: number; locais: { local: string; quantidade: number }[]; custo_medio: number | null; valor: number | null;
};
export type AlertaEstoque = {
  codigo: string; item: string; unidade_uso: string; local: string; quantidade: number;
  estoque_min: number; ponto_pedido: number | null; situacao: "sem_estoque" | "abaixo_minimo" | "ponto_pedido";
};
export type LoteVencendo = { item: string; unidade_uso: string; lote: string; validade: string; local: string; quantidade: number; dias_para_vencer: number };
export type EstoqueDaUnidade = { unidade: string; itens: ItemEstoque[]; alertas: AlertaEstoque[]; vencendo: LoteVencendo[] };

export async function estoqueNoErp(cnpj: string, ligacao?: LigacaoErp | null): Promise<EstoqueDaUnidade> {
  if (!ligacao && !erpConfigurado()) throw new Error("A ligação com o ERP não está configurada para esta empresa.");
  let r: Response;
  try {
    r = await chamarErp(`/api/estoque?cnpj=${cnpj}`, undefined, ligacao);
  } catch {
    throw new Error("Não foi possível falar com o ERP agora. Tente de novo em instantes.");
  }
  const corpo = (await r.json().catch(() => ({}))) as Partial<EstoqueDaUnidade> & { erro?: string };
  if (!r.ok) throw new Error(corpo.erro ?? `O ERP respondeu com erro ${r.status}.`);
  return { unidade: corpo.unidade ?? "", itens: corpo.itens ?? [], alertas: corpo.alertas ?? [], vencendo: corpo.vencendo ?? [] };
}
