import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { checklistTypeItems, checklistTypes, jobFunctions } from "../lib/db/schema";

// Contagem semanal do estoque (24/10/2026, a Nay: "liga a atividade de contar o estoque 31/10 com uma tarefa semanal
// de contar estoque para líderes de delivery e gerentes"). O ERP abre a contagem total todo sábado (a primeira em
// 31/10); aqui, um checklist semanal por função com um item que só fica conforme quando a contagem da semana foi
// feita em todos os locais da unidade (requiresContagem). Idempotente: não duplica nem mexe no que já existe.
const FUNCOES = ["Gerente", "Líder de Delivery"];
const ITEM = "Contar o estoque da semana (todos os itens, em Contagem de estoque)";

async function main() {
  for (const nome of FUNCOES) {
    const funcoes = await db.select({ id: jobFunctions.id, organizationId: jobFunctions.organizationId }).from(jobFunctions).where(eq(jobFunctions.name, nome));
    for (const f of funcoes) {
      const titulo = `Contagem do estoque — ${nome}`;
      let [tipo] = await db.select({ id: checklistTypes.id }).from(checklistTypes)
        .where(and(eq(checklistTypes.organizationId, f.organizationId), eq(checklistTypes.name, titulo))).limit(1);
      if (!tipo) {
        [tipo] = await db.insert(checklistTypes).values({
          organizationId: f.organizationId, name: titulo, type: "weekly", jobFunctionId: f.id,
          description: "Toda semana (sábado), a contagem total do estoque da unidade no app. O ERP confere que foi feita.",
        }).returning({ id: checklistTypes.id });
        console.log(`"${titulo}" criado.`);
      }
      const itens = await db.select({ label: checklistTypeItems.label }).from(checklistTypeItems).where(eq(checklistTypeItems.checklistTypeId, tipo!.id));
      if (itens.some((i) => i.label === ITEM)) { console.log(`"${titulo}" já tem o item, pulando.`); continue; }
      await db.insert(checklistTypeItems).values({ checklistTypeId: tipo!.id, label: ITEM, position: itens.length, requiresContagem: true });
      console.log(`"${titulo}": item adicionado.`);
    }
  }
  console.log("Concluído.");
}

main();
