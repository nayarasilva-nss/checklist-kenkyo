"use server";

import { revalidatePath } from "next/cache";
import { canFecharCaixa } from "@/lib/auth/caixa";
import { getCurrentUser } from "@/lib/auth/dal";
import { unidadeDaContagem } from "@/lib/data/contagem";
import { enviarCaixaAoErp } from "@/lib/erp/caixa";

export type ResultadoCaixa = { error?: string; ok?: string };
export type FechamentoForm = {
  data: string; caixa: string; fundo_abertura: string; dinheiro_gaveta: string; sangria: string; troco_do_cofre: string;
  valores: { grupo: string; valor: string }[]; observacao: string;
};

const dinheiro = (t: string) => t.trim() === "" || /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(t.trim());

/** Manda ao ERP o fechamento do caixa. Mandar de novo o mesmo caixa no mesmo dia corrige o que foi enviado. */
export async function enviarFechamentoCaixa(unidadeId: number, f: FechamentoForm): Promise<ResultadoCaixa> {
  const user = await getCurrentUser();
  if (!canFecharCaixa(user)) return { error: "Você não fecha o caixa pelo app." };
  const { unidade } = await unidadeDaContagem(user, unidadeId);
  if (!unidade || unidade.id !== unidadeId) return { error: "Unidade sem ligação com o ERP." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) return { error: "Data inválida." };
  if (f.dinheiro_gaveta.trim() === "") return { error: "Informe o dinheiro contado na gaveta (antes da sangria)." };
  const invalido = [["Dinheiro na gaveta", f.dinheiro_gaveta], ["Sangria", f.sangria], ["Troco do cofre", f.troco_do_cofre], ["Troco ao abrir", f.fundo_abertura],
    ...f.valores.map((v) => [v.grupo, v.valor])].find(([, v]) => !dinheiro(v ?? ""));
  if (invalido) return { error: `Valor inválido em ${invalido[0]}. Use números, como 1.250,40.` };
  const caixa = f.caixa.trim().slice(0, 40) || "Caixa";
  try {
    await enviarCaixaAoErp({
      id_externo: `${unidade.cnpj}:${f.data}:${caixa.toLowerCase()}`,
      unidade_cnpj: unidade.cnpj, data: f.data, caixa, quem: user.name,
      fundo_abertura: f.fundo_abertura.trim() || null, dinheiro_gaveta: f.dinheiro_gaveta.trim(),
      sangria: f.sangria.trim() || "0", troco_do_cofre: f.troco_do_cofre.trim() || "0",
      valores: f.valores.filter((v) => v.valor.trim() !== "").map((v) => ({ grupo: v.grupo, valor: v.valor.trim() })),
      observacao: f.observacao.trim().slice(0, 500),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível enviar o fechamento." };
  }
  revalidatePath("/caixa");
  return { ok: "Caixa fechado e enviado ao ERP. A sangria já entrou no cofre." };
}
