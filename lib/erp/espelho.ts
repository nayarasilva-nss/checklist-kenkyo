import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogCategories, catalogItems, requisicaoItens } from "@/lib/db/schema";
import { lerCatalogoErp } from "./integracao";
import type { ItemErp } from "./sugestao";

/**
 * Espelho do catálogo do ERP: o catálogo daqui passa a ter exatamente os
 * itens do ERP — mesmo nome, categoria e unidade, cada um ligado ao item de
 * lá com fator 1. Primeiro se monta o plano (o gestor vê o que muda), depois
 * se aplica o mesmo plano, recalculado na hora.
 *
 * - Produto já ligado a um item do ERP (Produtos do catálogo, com o gestor
 *   conferindo) fica sendo esse item, renomeado. Não se liga pelo nome aqui:
 *   o nome ignora tamanho e número (Caixa M e Caixa G, saco de 50 L e de
 *   100 L) e juntaria produtos diferentes.
 * - Produto sem ligação sai, e o item do ERP entra novo.
 * - Dois produtos daqui no mesmo item do ERP viram um: as requisições
 *   antigas passam a apontar para o que fica.
 * - Produto que o ERP não tem: já pedido → desativado (o histórico fica);
 *   nunca pedido → excluído.
 * - Item do ERP sem produto daqui → criado.
 */

type Produto = { id: number; name: string; unitMeasure: string; categoryId: number | null; erpItemCodigo: string | null; usos: number };
type Unidade = "kg" | "g" | "un" | "L" | "ml" | "cx" | "pct";

export type PlanoEspelho = {
  criar: { codigo: string; nome: string }[];
  renomear: { id: number; de: string; para: string }[];
  manter: number;
  juntar: { id: number; nome: string; em: string }[];
  desativar: { id: number; nome: string }[];
  excluir: { id: number; nome: string }[];
};

type PlanoInterno = PlanoEspelho & {
  guardiao: Map<string, number>; // código do ERP → produto que fica
  duplicados: { id: number; guardiao: number }[];
  nomes: Map<string, string>; // código do ERP → nome daqui (único)
  itens: Map<string, ItemErp>;
};

const UNIDADE: Record<string, Unidade> = { KG: "kg", G: "g", L: "L", ML: "ml", UN: "un", CX: "cx", PACOTE: "pct", PCT: "pct" };
// Unidade que o checklist não tem (ROLO, BALDE, MC…) vira "un": 1 un = 1 do ERP.
export const unidadeDoErp = (u: string): Unidade => UNIDADE[u.toUpperCase()] ?? "un";

async function produtosDaEmpresa(organizationId: number): Promise<Produto[]> {
  return db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      unitMeasure: catalogItems.unitMeasure,
      categoryId: catalogItems.categoryId,
      erpItemCodigo: catalogItems.erpItemCodigo,
      usos: sql<number>`(SELECT count(*)::int FROM requisicao_itens ri WHERE ri.catalog_item_id = ${catalogItems.id})`,
    })
    .from(catalogItems)
    .where(and(eq(catalogItems.organizationId, organizationId), eq(catalogItems.ativo, true)));
}

function montarPlano(produtos: Produto[], itensErp: ItemErp[]): PlanoInterno {
  const itens = new Map(itensErp.map((i) => [i.codigo, i]));
  // nome do ERP pode repetir: o segundo leva o código junto
  const nomes = new Map<string, string>();
  const vistos = new Set<string>();
  for (const i of itensErp) {
    const nome = vistos.has(i.nome) ? `${i.nome} (${i.codigo})` : i.nome;
    vistos.add(i.nome);
    nomes.set(i.codigo, nome.slice(0, 255));
  }

  // cada produto → o item do ERP a que está ligado (ligação que ainda existe lá)
  const candidatos = new Map<string, Produto[]>();
  const semPar: Produto[] = [];
  for (const p of produtos) {
    const codigo = p.erpItemCodigo && itens.has(p.erpItemCodigo) ? p.erpItemCodigo : null;
    if (!codigo) { semPar.push(p); continue; }
    candidatos.set(codigo, [...(candidatos.get(codigo) ?? []), p]);
  }

  const plano: PlanoInterno = { criar: [], renomear: [], manter: 0, juntar: [], desativar: [], excluir: [], guardiao: new Map(), duplicados: [], nomes, itens };
  for (const [codigo, lista] of candidatos) {
    // fica: o mais pedido, depois o mais antigo
    lista.sort((a, b) => b.usos - a.usos || a.id - b.id);
    const fica = lista[0]!;
    plano.guardiao.set(codigo, fica.id);
    const para = nomes.get(codigo)!;
    if (fica.name !== para) plano.renomear.push({ id: fica.id, de: fica.name, para });
    else plano.manter++;
    for (const outro of lista.slice(1)) {
      plano.juntar.push({ id: outro.id, nome: outro.name, em: para });
      plano.duplicados.push({ id: outro.id, guardiao: fica.id });
    }
  }
  for (const i of itensErp) if (!plano.guardiao.has(i.codigo)) plano.criar.push({ codigo: i.codigo, nome: nomes.get(i.codigo)! });
  for (const p of semPar) (p.usos > 0 ? plano.desativar : plano.excluir).push({ id: p.id, nome: p.name });
  return plano;
}

const publico = (p: PlanoInterno): PlanoEspelho => ({
  criar: p.criar, renomear: p.renomear, manter: p.manter, juntar: p.juntar, desativar: p.desativar, excluir: p.excluir,
});

export async function planoEspelho(organizationId: number): Promise<PlanoEspelho> {
  const [catalogo, produtos] = await Promise.all([lerCatalogoErp(), produtosDaEmpresa(organizationId)]);
  return publico(montarPlano(produtos, catalogo.itens));
}

export async function aplicarEspelho(organizationId: number): Promise<PlanoEspelho> {
  const [catalogo, produtos] = await Promise.all([lerCatalogoErp(), produtosDaEmpresa(organizationId)]);
  if (catalogo.itens.length === 0) throw new Error("O ERP devolveu o catálogo vazio: nada foi alterado.");
  const plano = montarPlano(produtos, catalogo.itens);

  await db.transaction(async (tx) => {
    // categorias do ERP (cria as que faltam)
    const existentes = await tx.select({ id: catalogCategories.id, name: catalogCategories.name })
      .from(catalogCategories).where(eq(catalogCategories.organizationId, organizationId));
    const categoria = new Map(existentes.map((c) => [c.name, c.id]));
    for (const nome of new Set(catalogo.itens.map((i) => i.categoria))) {
      if (categoria.has(nome)) continue;
      const [nova] = await tx.insert(catalogCategories).values({ organizationId, name: nome }).returning({ id: catalogCategories.id });
      categoria.set(nome, nova!.id);
    }

    // duplicados: o histórico passa para o que fica
    for (const d of plano.duplicados) {
      await tx.update(requisicaoItens).set({ catalogItemId: d.guardiao }).where(eq(requisicaoItens.catalogItemId, d.id));
    }
    const sai = [...plano.duplicados.map((d) => d.id), ...plano.excluir.map((e) => e.id)];
    if (sai.length > 0) await tx.delete(catalogItems).where(inArray(catalogItems.id, sai));

    // desativados largam o nome (pode ser o de um item do ERP)
    for (const d of plano.desativar) {
      await tx.update(catalogItems).set({ ativo: false, name: `${d.nome} (antigo ${d.id})`.slice(0, 255) }).where(eq(catalogItems.id, d.id));
    }

    // os que ficam: primeiro um nome provisório (dois podem trocar de nome
    // entre si), depois o nome, a categoria e a unidade do ERP
    const ficam = [...plano.guardiao.entries()];
    for (const [, id] of ficam) await tx.update(catalogItems).set({ name: `__espelho_${id}` }).where(eq(catalogItems.id, id));
    for (const [codigo, id] of ficam) {
      const item = plano.itens.get(codigo)!;
      await tx.update(catalogItems).set({
        name: plano.nomes.get(codigo)!,
        categoryId: categoria.get(item.categoria) ?? null,
        unitMeasure: unidadeDoErp(item.unidade_uso),
        erpItemCodigo: codigo,
        erpFator: "1",
        ativo: true,
      }).where(eq(catalogItems.id, id));
    }

    if (plano.criar.length > 0) {
      await tx.insert(catalogItems).values(plano.criar.map((c) => {
        const item = plano.itens.get(c.codigo)!;
        return {
          organizationId,
          name: c.nome,
          categoryId: categoria.get(item.categoria) ?? null,
          unitMeasure: unidadeDoErp(item.unidade_uso),
          erpItemCodigo: c.codigo,
          erpFator: "1",
        };
      }));
    }

    // categoria antiga que ficou sem nenhum produto sai
    await tx.execute(sql`DELETE FROM catalog_categories c WHERE c.organization_id = ${organizationId}
      AND NOT EXISTS (SELECT 1 FROM catalog_items i WHERE i.category_id = c.id)`);
  });

  return publico(plano);
}
