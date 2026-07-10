import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { jobFunctions, templates, templateItems } from "../lib/db/schema";

const JOB_FUNCTION_NAME = "Gerente";

const ROUTINE_TEMPLATES = [
  {
    name: "Gerente - Pré-Operação",
    description: "Guia Operacional do Gerente — Kenkyo (pré-operação)",
    items: [
      "Ler diário anterior",
      "Definir prioridades",
      "Alinhar com líderes",
      "Tratar anomalias",
      "Verificar estoque crítico",
      "Validar padrão da equipe",
      "Checar planilhas e controles",
      "Ajustar comunicação",
      "Antecipar experiência",
    ],
  },
  {
    name: "Gerente - Pré-Abertura",
    description: "Guia Operacional do Gerente — Kenkyo (pré-abertura)",
    items: ["Conduzir reunião", "Alinhar setores"],
  },
  {
    name: "Gerente - Operação",
    description: "Guia Operacional do Gerente — Kenkyo (operação)",
    items: [
      "Corrigir desvios",
      "Dar feedback",
      "Monitorar operação",
      "Ajustar rota",
    ],
  },
  {
    name: "Gerente - Fechamento",
    description: "Guia Operacional do Gerente — Kenkyo (fechamento)",
    items: [
      "Atualizar estoque no sistema",
      "Fechar caixa",
      "Enviar compras",
      "Registrar anomalias",
      "Reportar ao RH",
      "Analisar o dia e preencher diário",
      "Garantir fechamento correto",
    ],
  },
];

async function main() {
  const existingJobFunction = await db
    .select({ id: jobFunctions.id })
    .from(jobFunctions)
    .where(eq(jobFunctions.name, JOB_FUNCTION_NAME))
    .limit(1);

  let jobFunctionId: number;
  if (existingJobFunction.length === 0) {
    const [created] = await db
      .insert(jobFunctions)
      .values({ name: JOB_FUNCTION_NAME })
      .returning({ id: jobFunctions.id });
    jobFunctionId = created.id;
    console.log(`Função "${JOB_FUNCTION_NAME}" criada.`);
  } else {
    jobFunctionId = existingJobFunction[0].id;
    console.log(`Função "${JOB_FUNCTION_NAME}" já existe, pulando.`);
  }

  const existingTemplates = await db
    .select({ name: templates.name })
    .from(templates);
  const existingNames = new Set(existingTemplates.map((t) => t.name));

  for (const template of ROUTINE_TEMPLATES) {
    if (existingNames.has(template.name)) {
      console.log(`Modelo "${template.name}" já existe, pulando.`);
      continue;
    }

    const [created] = await db
      .insert(templates)
      .values({
        name: template.name,
        description: template.description,
        jobFunctionId,
      })
      .returning({ id: templates.id });

    await db.insert(templateItems).values(
      template.items.map((label, position) => ({
        templateId: created.id,
        label,
        position,
      })),
    );
    console.log(`Modelo "${template.name}" criado (${template.items.length} tarefas).`);
  }

  console.log("Rotina do Gerente importada.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
