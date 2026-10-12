import "server-only";
import { chamarErp, erpConfigurado } from "./integracao";

/**
 * Contagem de estoque no ERP, pelo app. A contagem mora lá: aqui só se lê o
 * que contar e se manda o que foi contado. Às cegas — o ERP nunca manda o
 * saldo do sistema. Entregue para conferência, quem confere e fecha é o
 * gerente, no ERP (as diferenças viram ajuste de estoque lá).
 */

export type ContagemResumo = { id: number; local: string; escopo: string; data: string; status: "aberta" | "contada"; itens: number; contados: number; curva: string | null };
export type ContagemDevida = { agenda_id: number; local: string; curva: string; dias_desde: number | null; periodicidade_dias: number };
export type ItemContagem = {
  linha_id: number; codigo: string; nome: string; unidade_uso: string; categoria: string;
  setores: string[]; dono: string | null; qtd_contada: string | null; contado_por: string | null;
};
export type ContagemDetalhe = { id: number; local: string; status: string; escopo: string; data: string; unidade: string; itens: ItemContagem[] };

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  if (!erpConfigurado()) throw new Error("A ligação com o ERP não está configurada.");
  let r: Response;
  try {
    r = await chamarErp(caminho, init);
  } catch {
    throw new Error("Não foi possível falar com o ERP agora. Tente de novo em instantes.");
  }
  const corpo = (await r.json().catch(() => ({}))) as T & { erro?: string };
  if (!r.ok) throw new Error(corpo.erro ?? `O ERP respondeu com erro ${r.status}.`);
  return corpo;
}

export function contagensNoErp(cnpj: string) {
  return pedir<{ unidade: string; contagens: ContagemResumo[]; devidas: ContagemDevida[] }>(`/api/contagens?cnpj=${cnpj}`);
}

export function abrirContagemNoErp(cnpj: string, agendaId: number) {
  return pedir<{ id: number; local: string }>("/api/contagens", { method: "POST", body: JSON.stringify({ cnpj, agenda_id: agendaId }) });
}

export function contagemNoErp(id: number, cnpj: string) {
  return pedir<ContagemDetalhe>(`/api/contagens/${id}?cnpj=${cnpj}`);
}

export function gravarContagemNoErp(id: number, cnpj: string, quem: string, itens: { linha_id: number; qtd: string | null }[], terminar: boolean) {
  return pedir<{ ok: boolean; gravadas: number; falta: number; status: string }>(`/api/contagens/${id}`, {
    method: "POST",
    body: JSON.stringify({ cnpj, quem, itens, terminar }),
  });
}
