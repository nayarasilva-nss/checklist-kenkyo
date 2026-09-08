import { eq, like, max } from "drizzle-orm";
import { db } from "../lib/db";
import { checklistTypeItems, checklistTypes } from "../lib/db/schema";

const ITEM_LABEL = "Preencher requisição de insumos";
const EXISTING_LABEL = "Preencher requisição de insumos — faltas comunicadas ao gerente da unidade";

async function main() {
  // O Líder de Sushibar já tem uma versão dessa tarefa — só marca como
  // condicional à requisição, não duplica.
  await db
    .update(checklistTypeItems)
    .set({ requiresRequisicao: true })
    .where(eq(checklistTypeItems.label, EXISTING_LABEL));
  console.log(`Item existente do Líder de Sushibar marcado como requiresRequisicao.`);

  const fechamentoTypes = await db
    .select({ id: checklistTypes.id, name: checklistTypes.name })
    .from(checklistTypes)
    .where(like(checklistTypes.name, "%Fechamento%"));

  for (const type of fechamentoTypes) {
    const existingItems = await db
      .select({ label: checklistTypeItems.label })
      .from(checklistTypeItems)
      .where(eq(checklistTypeItems.checklistTypeId, type.id));

    if (existingItems.some((i) => i.label === ITEM_LABEL || i.label === EXISTING_LABEL)) {
      console.log(`"${type.name}" já tem a tarefa de insumos, pulando.`);
      continue;
    }

    const [{ maxPosition }] = await db
      .select({ maxPosition: max(checklistTypeItems.position) })
      .from(checklistTypeItems)
      .where(eq(checklistTypeItems.checklistTypeId, type.id));

    await db.insert(checklistTypeItems).values({
      checklistTypeId: type.id,
      label: ITEM_LABEL,
      position: (maxPosition ?? -1) + 1,
      requiresPhoto: false,
      requiresShiftLog: false,
      requiresRequisicao: true,
    });
    console.log(`"${type.name}": item adicionado.`);
  }

  console.log("Concluído.");
}

main();
