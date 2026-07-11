import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  checklistTypes,
  checklistTypeItems,
  templates,
  templateItems,
} from "../lib/db/schema";

async function main() {
  const existingChecklistNames = new Set(
    (await db.select({ name: checklistTypes.name }).from(checklistTypes)).map(
      (c) => c.name,
    ),
  );

  const allTemplates = await db.select().from(templates);

  for (const template of allTemplates) {
    if (existingChecklistNames.has(template.name)) {
      console.log(`"${template.name}" já existe como checklist, pulando.`);
      continue;
    }

    const items = await db
      .select()
      .from(templateItems)
      .where(eq(templateItems.templateId, template.id))
      .orderBy(templateItems.position);

    const [created] = await db
      .insert(checklistTypes)
      .values({
        name: template.name,
        description: template.description,
        type: "daily",
        jobFunctionId: template.jobFunctionId,
      })
      .returning({ id: checklistTypes.id });

    if (items.length > 0) {
      await db.insert(checklistTypeItems).values(
        items.map((item) => ({
          checklistTypeId: created.id,
          label: item.label,
          position: item.position,
        })),
      );
    }

    console.log(
      `"${template.name}" migrado para checklist (tipo: diário, ${items.length} tarefas).`,
    );
  }

  console.log("Migração de modelos concluída.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
