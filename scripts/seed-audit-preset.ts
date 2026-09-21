import { count, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { auditGroups, auditItems, audits, organizations } from "../lib/db/schema";

// Preset de critérios da Kenkyo (documento Criterios-Auditoria-Kenkyo.pdf).
const PRESET: [string, [string, string, number, string, string][]][] = [
 [
  "Instalações e Estrutura",
  [
   [
    "Climatização desligada fora do expediente",
    "Verificar na abertura ou pela câmera; cruzar com checklist de fechamento",
    2,
    "Gerente",
    "Todas"
   ],
   [
    "Iluminação funcionando",
    "Lâmpadas queimadas no salão, na cozinha e na fachada",
    1,
    "Gerente",
    "Todas"
   ],
   [
    "Som em volume e playlist padrão",
    "Conferir durante o serviço",
    1,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Equipamentos de refrigeração em temperatura",
    "Leitura dos termômetros das câmaras, geladeiras e freezers vs. faixa padrão",
    3,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Registro de temperatura preenchido",
    "Planilha ou app com leituras do dia",
    2,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Manutenção de equipamentos em dia",
    "Sem vazamentos, borrachas de vedação íntegras, exaustão funcionando",
    2,
    "Gerente",
    "Todas"
   ],
   [
    "Estrutura física íntegra",
    "Piso, paredes, teto e forro sem avarias, infiltração ou mofo",
    2,
    "Gerente",
    "Todas"
   ],
   [
    "Banheiros limpos e abastecidos",
    "Papel, sabonete, lixeira e limpeza",
    2,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Lavatório de mãos da cozinha abastecido",
    "Sabonete, papel toalha e álcool",
    3,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Extintores e saídas de emergência",
    "Validade dos extintores, saídas desobstruídas",
    3,
    "Gerente",
    "Todas"
   ],
   [
    "Controle de pragas em dia",
    "Certificado de dedetização vigente, sem vestígios",
    3,
    "Gerente",
    "Todas"
   ]
  ]
 ],
 [
  "Segurança Alimentar",
  [
   [
    "Todos os insumos manipulados etiquetados",
    "Amostragem de 10 potes por praça",
    3,
    "Líder da praça",
    "Todas"
   ],
   [
    "Nenhum item com validade vencida",
    "Mesma amostragem, mais uma varredura das câmaras",
    3,
    "Chefe da praça",
    "Todas"
   ],
   [
    "Etiqueta completa",
    "Produto, fabricação, validade e responsável",
    2,
    "Líder da praça",
    "Todas"
   ],
   [
    "PVPS aplicado",
    "Mais antigos à frente nas prateleiras e câmaras",
    2,
    "Líder de Estoque",
    "Todas"
   ],
   [
    "Separação crus × prontos",
    "Nada cru acima de pronto; peixe isolado",
    3,
    "Chefe da praça",
    "Todas"
   ],
   [
    "Recipientes adequados e tampados",
    "Sem filme reaproveitado, sem pote rachado",
    2,
    "Líder da praça",
    "Todas"
   ],
   [
    "Descongelamento correto",
    "Sob refrigeração, nunca em bancada",
    3,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Higienização de hortifrútis registrada",
    "Registro da sanitização e diluição correta",
    2,
    "Chefe de Cozinha",
    "Todas"
   ]
  ]
 ],
 [
  "Cozinha",
  [
   [
    "Mise en place conforme ficha técnica",
    "Porções e cortes vs. ficha",
    2,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Bancadas e utensílios limpos durante o serviço",
    "Observação no pico",
    2,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Óleo de fritura dentro do padrão",
    "Cor, cheiro e registro de troca",
    2,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Organização das câmaras",
    "Setorização, nada no chão",
    2,
    "Chefe de Cozinha",
    "Todas"
   ],
   [
    "Checklist de abertura e fechamento executado",
    "App: completo, no horário, fotos coerentes com o real",
    2,
    "Chefe de Cozinha",
    "Todas"
   ]
  ]
 ],
 [
  "Sushibar",
  [
   [
    "Peixe em temperatura e acondicionamento corretos",
    "Vitrine ou câmara, cobertura, gelo",
    3,
    "Chefe de Sushibar",
    "Todas"
   ],
   [
    "Arroz dentro do padrão",
    "Tempero, temperatura e tempo de exposição",
    2,
    "Líder de Sushibar",
    "Todas"
   ],
   [
    "Montagem conforme ficha técnica",
    "Amostragem de 2 a 3 pratos",
    2,
    "Líder de Sushibar",
    "Todas"
   ],
   [
    "Molhos abastecidos para a operação",
    "Níveis no início do turno",
    1,
    "Líder de Sushibar",
    "Todas"
   ],
   [
    "Verificação supervisória diária realizada",
    "Registro do Chefe de Sushibar no app",
    2,
    "Chefe de Sushibar",
    "Todas"
   ]
  ]
 ],
 [
  "Bar",
  [
   [
    "Frutas e insumos frescos e etiquetados",
    "Amostragem",
    2,
    "Líder de Bar",
    "Unidades com salão"
   ],
   [
    "Drinks conforme ficha técnica",
    "Dosagem e apresentação",
    2,
    "Líder de Bar",
    "Unidades com salão"
   ],
   [
    "Gelo de origem segura e armazenado corretamente",
    "Máquina limpa, pá fora do gelo",
    3,
    "Líder de Bar",
    "Unidades com salão"
   ],
   [
    "Estoque de bebidas refrigerado e abastecido",
    "Rupturas no início do serviço",
    1,
    "Líder de Bar",
    "Unidades com salão"
   ]
  ]
 ],
 [
  "Estoque e Produção",
  [
   [
    "Estoque organizado e setorizado",
    "Endereçamento, nada no chão",
    2,
    "Líder de Estoque",
    "Todas"
   ],
   [
    "Requisições registradas no sistema",
    "Saídas físicas × app de requisição",
    2,
    "Líder de Estoque",
    "Todas"
   ],
   [
    "Recebimento conferido",
    "Temperatura na entrega, nota × pedido",
    2,
    "Líder de Estoque",
    "Todas"
   ],
   [
    "Produção conforme ficha e rendimento",
    "Rendimento real vs. esperado",
    2,
    "Líder de Produção",
    "Todas"
   ],
   [
    "Descarte registrado",
    "Registro de perdas do dia",
    2,
    "Líder de Estoque",
    "Todas"
   ]
  ]
 ],
 [
  "Salão e Atendimento – Método A.M.E.",
  [
   [
    "Recepção em até X segundos (definir tempo)",
    "Observação",
    2,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Sugestão de bebidas antes dos pratos",
    "Observação em 3 mesas",
    2,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Oferta alinhada ao perfil do cliente",
    "Observação",
    1,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Conhecimento do cardápio",
    "Pergunta aleatória a um atendente",
    2,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Tempo de saída dos pratos dentro do padrão",
    "Comanda × entrega",
    2,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Mesas montadas e salão limpo",
    "Padrão de montagem",
    1,
    "Gerente",
    "Unidades com salão"
   ],
   [
    "Uniforme e apresentação pessoal",
    "Padrão do manual do colaborador",
    1,
    "Gerente",
    "Todas"
   ]
  ]
 ],
 [
  "Delivery",
  [
   [
    "Embalagem padrão e lacrada",
    "Amostragem de pedidos",
    2,
    "Líder de Delivery",
    "Unidades com delivery"
   ],
   [
    "Conferência do pedido antes da saída",
    "Itens, molhos, hashi, brinde",
    2,
    "Líder de Delivery",
    "Unidades com delivery"
   ],
   [
    "Tempo de preparo dentro do padrão",
    "Relatório da plataforma",
    2,
    "Líder de Delivery",
    "Unidades com delivery"
   ],
   [
    "Bolsas térmicas limpas",
    "Inspeção visual",
    2,
    "Líder de Delivery",
    "Unidades com delivery"
   ],
   [
    "Avaliações respondidas nas plataformas",
    "Checar respostas pendentes",
    1,
    "Líder de Delivery",
    "Unidades com delivery"
   ]
  ]
 ],
 [
  "Gestão da Unidade",
  [
   [
    "Checklists de todas as funções executados nos últimos 7 dias",
    "Taxa de execução no app",
    2,
    "Gerente",
    "Todas"
   ],
   [
    "Anomalias registradas e com tratativa",
    "Planilha de anomalias, sem item aberto > 7 dias",
    2,
    "Gerente",
    "Todas"
   ],
   [
    "Plano de ação da visita anterior cumprido",
    "Revisar ações da última auditoria",
    3,
    "Gerente",
    "Todas"
   ],
   [
    "Escala publicada e cumprida",
    "Escala × presença",
    1,
    "Gerente",
    "Todas"
   ],
   [
    "Documentação sanitária vigente",
    "Alvará, manual de BPF, ASOs",
    3,
    "Gerente",
    "Todas"
   ]
  ]
 ]
];

// Só carrega se a Kenkyo ainda não tem modelo, ou se tem só o modelo
// provisório de 4 critérios e nenhuma auditoria feita — nunca sobrescreve
// edição real do Gestor.
async function main() {
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, "kenkyo"));
  if (!org) return;

  const [{ n: auditCount }] = await db.select({ n: count() }).from(audits).where(eq(audits.organizationId, org.id));
  const groups = await db.select().from(auditGroups).where(eq(auditGroups.organizationId, org.id));
  const items = groups.length
    ? await db.select({ id: auditItems.id }).from(auditItems).innerJoin(auditGroups, eq(auditGroups.id, auditItems.groupId)).where(eq(auditGroups.organizationId, org.id))
    : [];

  if (groups.length > 0 && !(auditCount === 0 && items.length <= 4)) {
    console.log("Modelo de auditoria já existe, pulando.");
    return;
  }
  if (groups.length > 0) await db.delete(auditGroups).where(eq(auditGroups.organizationId, org.id));

  let p = 0;
  for (const [name, list] of PRESET) {
    const [g] = await db.insert(auditGroups).values({ organizationId: org.id, name, position: p++ }).returning({ id: auditGroups.id });
    await db.insert(auditItems).values(
      list.map(([label, howToVerify, weight, responsible, appliesTo], i) => ({ groupId: g.id, label, howToVerify, weight, responsible, appliesTo, position: i })),
    );
  }
  console.log(`Modelo de auditoria carregado: ${PRESET.length} grupos.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
