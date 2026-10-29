import "server-only";
import { chamarErp, erpConfigurado } from "./integracao";

/**
 * Fechamento de caixa no ERP, pelo app. O fechamento mora lá: aqui se lê o que preencher (as formas de pagamento que
 * a loja usa) e se manda o que foi apurado. A sangria vai na hora para o cofre; o financeiro confere no dia seguinte.
 */

export type FechamentoCaixa = {
  id: number; caixa: string; quem_fechou: string | null; fundo_abertura: string | null; dinheiro_gaveta: string; troco_final: string;
  sangria: string; troco_do_cofre: string; observacao: string | null; conferido: boolean;
  valores: { terminal: string; grupo: string; valor: string }[];
  vouchers: { codigo: string; valor: string; situacao: string | null }[];
  saidas: { finalidade: string; valor: string }[];
  // voucher VENDIDO neste caixa (a aquisição); um ERP mais antigo não manda este campo
  vouchers_vendidos?: { codigo: string; valor: string; forma: string; cliente: string | null; validade: string | null; situacao: string | null }[];
};
export type CaixaDoDia = { unidade: string; data: string; desde?: string | null; linhas_maquininha: string[]; outras: string[]; fechamentos: FechamentoCaixa[] };
export type EnvioCaixa = {
  id_externo: string; unidade_cnpj: string; data: string; caixa: string; quem: string; fundo_abertura: string | null;
  suprimento: string; sangria: string; troco_final: string; observacao: string;
  valores: { terminal: string; grupo: string; valor: string }[];
  vouchers: { codigo: string; valor: string }[];
  saidas: { finalidade: string; valor: string }[];
  vouchers_vendidos: { codigo: string; valor: string; forma: string; cliente: string; validade: string }[];
};

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  if (!erpConfigurado()) throw new Error("A ligação com o ERP não está configurada.");
  let r: Response;
  try {
    r = await chamarErp(caminho, init);
  } catch {
    throw new Error("Não foi possível falar com o ERP agora. Tente de novo em instantes.");
  }
  const corpo = (await r.json().catch(() => ({}))) as T & { erro?: string; erros?: string[] };
  if (!r.ok) throw new Error(corpo.erros?.join(" ") ?? corpo.erro ?? `O ERP respondeu com erro ${r.status}.`);
  return corpo;
}

export function caixaNoErp(cnpj: string, data: string) {
  return pedir<CaixaDoDia>(`/api/caixa?cnpj=${cnpj}&data=${data}`);
}

export function enviarCaixaAoErp(envio: EnvioCaixa) {
  return pedir<{ id: number }>("/api/caixa", { method: "POST", body: JSON.stringify(envio) });
}
