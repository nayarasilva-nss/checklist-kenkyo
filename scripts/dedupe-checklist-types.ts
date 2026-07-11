import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../lib/db";
import {
  checklistTypes,
  checklistTypeItems,
  checklistCompletions,
} from "../lib/db/schema";

async function main() {
  const all = await db
    .select()
    .from(checklistTypes)
    .orderBy(checklistTypes.id);

  const byName = new Map<string, typeof all>();
  for (const row of all) {
    const list = byName.get(row.name) ?? [];
    list.push(row);
    byName.set(row.name, list);
  }

  for (const [name, rows] of byName) {
    if (rows.length <= 1) continue;

    const [keep, ...dupes] = rows;
    for (const dupe of dupes) {
      const items = await db
        .select({ id: checklistTypeItems.id })
        .from(checklistTypeItems)
        .where(eq(checklistTypeItems.checklistTypeId, dupe.id));
      const itemIds = items.map((i) => i.id);

      let completionCount = 0;
      if (itemIds.length > 0) {
        const [row] = await db
          .select({ count: sql<string>`count(*)` })
          .from(checklistCompletions)
          .where(inArray(checklistCompletions.itemId, itemIds));
        completionCount = Number(row?.count ?? 0);
      }

      if (completionCount > 0) {
        console.log(
          `Mantendo duplicata "${name}" (id ${dupe.id}) — tem ${completionCount} registro(s) de conclusão.`,
        );
        continue;
      }

      await db.delete(checklistTypes).where(eq(checklistTypes.id, dupe.id));
      console.log(
        `Removida duplicata "${name}" (id ${dupe.id}), mantendo id ${keep.id}.`,
      );
    }
  }

  console.log("Deduplicação de modelos concluída.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
