import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { jobFunctions, checklistTypes, checklistTypeItems } from "../lib/db/schema";

const JOB_FUNCTION_NAME = "Chefe";
const CHECKLIST_NAME = "Verificação do Souschef";
const CHECKLIST_DESCRIPTION =
  "Verificações do Souschef — Controle Operacional e Qualidade";

const ITEMS = [
  // Gestão da Equipe e Postura Operacional
  "Presença e pontualidade da equipe",
  "Uniforme completo e higiene pessoal",
  "Postura e foco da equipe na operação",
  "Delegação das funções do turno",
  "Treinamento ou orientação pontual (novo colaborador)",
  // Segurança Alimentar — Temperaturas
  "Temperatura dos refrigeradores",
  "Temperatura do freezer",
  "Temperatura de peixes e proteínas na vitrine",
  "Equipamentos de refrigeração sem alarme ou gelo excessivo",
  // Segurança Alimentar — Validade e Rastreabilidade
  "Etiquetagem de todos os recipientes e alimentos",
  "Verificação de validades — descartar vencidos",
  "PVPS aplicado (Primeiro que Vence, Primeiro que Sai)",
  "Produtos recebidos: conferência de qualidade e validade",
  "Ausência de produtos sem identificação em uso",
  // Segurança Alimentar — Higiene e Armazenamento
  "Higienização das bancadas e superfícies de preparo",
  "Higienização de utensílios (facas, tábuas, conchas, sudare)",
  "Separação de alimentos crus e cozidos",
  "Descarte correto de resíduos e lixo",
  "Organização do estoque de praça (mise en place)",
  "Controle de pragas: ausência de indícios",
  // BPF — Boas Práticas de Fabricação
  "Checagem geral do setor antes de iniciar",
  "Planilhas de controle preenchidas (conforme Nutrição)",
  "Registro de não conformidades no formulário padrão",
  "Limpeza completa da praça conforme cronograma do dia",
  "Relato ao Gerente Operacional dos problemas do turno",
  "Conferência da lista de compras (insumos faltantes)",
  // Controle de Qualidade dos Pratos
  "Pratos saindo conforme ficha técnica (ingredientes e montagem)",
  "Porcionamento dentro do padrão (sem excesso ou falta)",
  "Tempo de preparo dentro do SLA da operação",
  "Apresentação e finalização dos pratos conferida",
  "Controle de desperdício de peixes e insumos nobres",
  "Filetação e porcionamento de peixes dentro do padrão",
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
  }

  const existing = await db
    .select({ id: checklistTypes.id })
    .from(checklistTypes)
    .where(eq(checklistTypes.name, CHECKLIST_NAME))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Modelo "${CHECKLIST_NAME}" já existe, pulando.`);
    process.exit(0);
  }

  const [created] = await db
    .insert(checklistTypes)
    .values({
      name: CHECKLIST_NAME,
      description: CHECKLIST_DESCRIPTION,
      type: "daily",
      jobFunctionId,
    })
    .returning({ id: checklistTypes.id });

  await db.insert(checklistTypeItems).values(
    ITEMS.map((label, position) => ({
      checklistTypeId: created.id,
      label,
      position,
    })),
  );

  console.log(`Modelo "${CHECKLIST_NAME}" criado (${ITEMS.length} tarefas).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
