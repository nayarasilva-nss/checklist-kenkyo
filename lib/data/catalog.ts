import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogCategories, catalogItems, jobFunctions } from "@/lib/db/schema";
import { produtoDoSetor, setoresDosItensErp } from "@/lib/erp/integracao";

export async function getCatalogCategories(organizationId: number) {
  return db
    .select()
    .from(catalogCategories)
    .where(eq(catalogCategories.organizationId, organizationId))
    .orderBy(asc(catalogCategories.name));
}

export async function getCatalogItems(organizationId: number) {
  return db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      unitMeasure: catalogItems.unitMeasure,
      categoryId: catalogItems.categoryId,
      categoryName: catalogCategories.name,
    })
    .from(catalogItems)
    .leftJoin(catalogCategories, eq(catalogCategories.id, catalogItems.categoryId))
    .where(eq(catalogItems.organizationId, organizationId))
    .orderBy(asc(catalogItems.name));
}

/**
 * O catálogo da tela de requisição. Se a função de quem pede tem setor do
 * ERP (Gerenciar › ERP), cada produto vem marcado com doSetor: o formulário
 * mostra só os do setor e deixa "ver todos" para a exceção. Sem setor, sem
 * ERP ou com o ERP fora do ar, todos vêm como do setor.
 */
export async function getCatalogItemsParaRequisicao(organizationId: number, jobFunctionId: number | null, veTudo: boolean) {
  const [itens, funcao] = await Promise.all([
    db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        unitMeasure: catalogItems.unitMeasure,
        categoryId: catalogItems.categoryId,
        categoryName: catalogCategories.name,
        erpItemCodigo: catalogItems.erpItemCodigo,
      })
      .from(catalogItems)
      .leftJoin(catalogCategories, eq(catalogCategories.id, catalogItems.categoryId))
      .where(eq(catalogItems.organizationId, organizationId))
      .orderBy(asc(catalogItems.name)),
    !veTudo && jobFunctionId
      ? db.select({ erpSetor: jobFunctions.erpSetor }).from(jobFunctions).where(eq(jobFunctions.id, jobFunctionId)).limit(1)
      : Promise.resolve([]),
  ]);
  const setor = funcao[0]?.erpSetor ?? null;
  const mapa = setor ? await setoresDosItensErp() : null;
  return {
    setor: mapa ? setor : null,
    itens: itens.map(({ erpItemCodigo, ...item }) => ({
      ...item,
      doSetor: !mapa || !setor || produtoDoSetor(erpItemCodigo, setor, mapa),
    })),
  };
}
