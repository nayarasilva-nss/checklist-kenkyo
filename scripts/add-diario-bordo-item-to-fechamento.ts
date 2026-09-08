import { eq, like, max } from "drizzle-orm";
import { db } from "../lib/db";
import { checklistTypeItems, checklistTypes } from "../lib/db/schema";

const ITEM_LABEL = "Preencher o diário de bordo";

async function main() {
  const fechamentoTypes = await db
    .select({ id: checklistTypes.id, name: checklistTypes.name })
    .from(checklistTypes)
    .where(like(checklistTypes.name, "%Fechamento%"));

  for (const type of fechamentoTypes) {
    const existingItems = await db
      .select({ label: checklistTypeItems.label })
      .from(checklistTypeItems)
      .where(eq(checklistTypeItems.checklistTypeId, type.id));

    if (existingItems.some((i) => i.label === ITEM_LABEL)) {
      console.log(`"${type.name}" já tem o item, pulando.`);
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
      requiresShiftLog: true,
    });
    console.log(`"${type.name}": item adicionado.`);
  }

  console.log("Concluído.");
}

main();
