"use server";

import { revalidatePath } from "next/cache";
import { canContar, canEntregarContagem } from "@/lib/auth/contagem";
import { getCurrentUser } from "@/lib/auth/dal";
import { unidadeDaContagem } from "@/lib/data/contagem";
import { abrirContagemNoErp, gravarContagemNoErp } from "@/lib/erp/contagens";

export type ResultadoContagem = { error?: string; ok?: string; id?: number; falta?: number; entregue?: boolean };

/** Abre no ERP a contagem que a agenda pede (curva e local). */
export async function abrirContagem(unidadeId: number, agendaId: number): Promise<ResultadoContagem> {
  const user = await getCurrentUser();
  if (!canContar(user)) return { error: "Você não conta estoque." };
  const { unidade } = await unidadeDaContagem(user, unidadeId);
  if (!unidade || unidade.id !== unidadeId) return { error: "Unidade sem ligação com o ERP." };
  try {
    const r = await abrirContagemNoErp(unidade.cnpj, agendaId);
    revalidatePath("/contagem");
    return { ok: `Contagem do ${r.local} aberta.`, id: r.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível abrir a contagem." };
  }
}

/**
 * Manda ao ERP o que foi contado (só as linhas que mudaram). Com entregar,
 * passa a contagem para o gerente conferir no ERP — só com tudo contado.
 */
export async function salvarContagem(unidadeId: number, contagemId: number, itens: { linha_id: number; qtd: string | null }[], entregar: boolean): Promise<ResultadoContagem> {
  const user = await getCurrentUser();
  if (!canContar(user)) return { error: "Você não conta estoque." };
  if (entregar && !canEntregarContagem(user)) return { error: "Quem entrega a contagem para conferência é o gerente." };
  const { unidade } = await unidadeDaContagem(user, unidadeId);
  if (!unidade || unidade.id !== unidadeId) return { error: "Unidade sem ligação com o ERP." };
  const limpos = itens.filter((i) => Number.isInteger(i.linha_id)).map((i) => ({ linha_id: i.linha_id, qtd: i.qtd === null || i.qtd.trim() === "" ? null : i.qtd.trim() }));
  try {
    const r = await gravarContagemNoErp(contagemId, unidade.cnpj, user.name, limpos, entregar);
    revalidatePath("/contagem");
    revalidatePath(`/contagem/${contagemId}`);
    if (entregar) return { ok: "Contagem entregue. O gerente confere e fecha no ERP.", falta: 0, entregue: true };
    return { ok: r.falta === 0 ? "Salvo. Todos os itens contados." : `Salvo. Faltam ${r.falta} itens.`, falta: r.falta };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar a contagem." };
  }
}
