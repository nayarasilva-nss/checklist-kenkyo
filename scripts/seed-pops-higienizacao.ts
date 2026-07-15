import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "../lib/db";
import { documents, users } from "../lib/db/schema";

type Pop = {
  titulo: string;
  codigo: string;
  revisao: string;
  objetivo: string;
  responsaveis: string;
  frequencia: string;
  instrucoes: string[];
  materiais: string[];
  monitoramento: string;
  acoesCorretivas: string;
  verificacao: string;
};

const POPS: Pop[] = [
  {
    titulo: "Higienização da Caixa de Gordura",
    codigo: "PPHO 02.10",
    revisao: "00",
    objetivo:
      "Descrever os procedimentos de higienização correta da caixa de gordura a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos",
    frequencia: "Semanalmente ou sempre que necessário",
    instrucoes: [
      "Usar luva de borracha exclusiva para esta atividade",
      "Retirar a tampa com auxílio de chave de fenda",
      "Puxar a cesta de limpeza pela alça",
      "Retirar toda a gordura depositada na tampa e paredes com pá exclusiva, colocando em saco de lixo",
      "Garantir a retirada total da gordura aderida raspando com espátula exclusiva",
      "Esfregar toda a caixa (paredes e tampa) com escova ou vassoura exclusiva, água fervente e produto desengordurante",
      "Enxaguar bem (se possível, com água sob pressão) e deixar escoar",
      "Recolocar a tampa e fechar com a chave de fenda",
      "Alternativa: higienização pelo método biológico com microrganismos próprios para redução de gordura, ou contratação de empresa terceirizada",
    ],
    materiais: [
      "Pá",
      "Saco plástico",
      "Escova de cabo longo",
      "Produto desengordurante",
      "Água quente",
      "Luvas de borracha amarela",
    ],
    monitoramento:
      "Observação da higienização. Verificar se foi retirada toda a sujidade e produto utilizado. A luva deve ser específica para esta função.",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento da realização do procedimento para verificar eficácia",
  },
  {
    titulo: "Higienização de Mesas e Bancadas",
    codigo: "PPHO 02.01",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização de mesas e bancadas a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos e Auxiliar de serviços gerais",
    frequencia: "Diariamente e sempre que necessário",
    instrucoes: [
      "Retirar resíduos de alimentos com um pano ou esponja",
      "Esfregar com esponja e detergente as superfícies para eliminar a sujeira mais grossa",
      "Retirar o excesso de produto com água, até eliminar todo o resíduo de sujeira e detergente neutro",
      "Utilizar pano descartável seco e limpo para secagem da superfície",
      "Borrifar álcool 70% para desinfetar a superfície",
      "Deixar secar naturalmente",
    ],
    materiais: [
      "Esponja (exclusiva para esta finalidade)",
      "Detergente neutro",
      "Álcool 70% ou outro produto desinfetante",
      "Pano descartável",
      "Borrifador",
    ],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização para correções e orientações",
  },
  {
    titulo: "Higienização de Freezer, Geladeira e Balcão Refrigerado",
    codigo: "PPHO 02.11",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização de freezer, geladeira e balcão refrigerado a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos",
    frequencia:
      "Diariamente: limpeza das portas e borrachas. Semanalmente: higienização completa do refrigerado e balcão refrigerado. Mensalmente: higienização completa do freezer",
    instrucoes: [
      "Desligar o equipamento",
      "Retirar todos os produtos e armazenar em caixa de isopor ou outro equipamento",
      "No caso de freezer, aguardar descongelamento e retirar excesso de água com pano",
      "Colocar luvas de borracha",
      "Higienizar paredes internas, grades, borrachas de vedação e portas com esponja e detergente",
      "Umedecer pano limpo e descartável com água e retirar toda a espuma",
      "Borrifar álcool 70% e deixar secar naturalmente",
      "Ligar o equipamento logo após a secagem",
      "Recolocar os alimentos de forma organizada, respeitando a ordem: crus, semi prontos e prontos",
    ],
    materiais: [
      "Esponja (exclusiva para esta finalidade)",
      "Detergente neutro ou clorado",
      "Álcool 70%",
      "Pano descartável",
      "Borrifador",
      "Balde / Caixa térmica",
      "Luva descartável",
    ],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização do Ar Condicionado",
    codigo: "PPHO 02.13",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização do ar condicionado a fim de evitar a contaminação dos alimentos e do ambiente.",
    responsaveis: "Manipuladores de alimentos e empresa terceirizada",
    frequencia: "Mensal",
    instrucoes: [
      "Desligar o ar condicionado da tomada",
      "Retirar o filtro de ar",
      "Se estiver muito sujo, lavar em água corrente e, se necessário, usar esponja e sabão neutro",
      "Após a limpeza, secar bem o filtro antes de recolocá-lo",
      "Utilizar pano descartável limpo e úmido para limpar o lado externo do ar condicionado",
      "Deixar secar naturalmente",
      "Colocar novamente na tomada e utilizar",
    ],
    materiais: ["Esponja (exclusiva para esta finalidade)", "Detergente neutro", "Pano descartável", "Água"],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização da Coifa",
    codigo: "PPHO 02.15",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização da coifa a fim de evitar o mau funcionamento do equipamento e a contaminação do alimento.",
    responsaveis: "Manipuladores de alimentos",
    frequencia:
      "Parte externa — semanalmente. Parte interna — semestralmente ou quando necessário por empresa terceirizada.",
    instrucoes: [
      "Colocar luvas, avental e óculos de segurança",
      "Desligar a coifa da tomada",
      "Retirar os filtros da coifa (caso tenha)",
      "Retirar os resíduos com água morna e auxílio de esponja/fibraço",
      "Aplicar detergente desengordurante com esponja/fibraço e deixar agir por 10 minutos",
      "Enxaguar até retirar completamente o produto",
      "Aplicar detergente neutro e deixar agir por 10 minutos",
      "Esfregar com fibraço",
      "Enxaguar até retirada completa do produto e deixar secar naturalmente",
      "Finalizar com pano umedecido com solução clorada (álcool 70% ou água sanitária diluída — 1 litro de água para 1 colher de água sanitária)",
      "Colocar os filtros de molho no desincrustante por 10 minutos",
      "Esfregar até retirar todos os resíduos, enxaguar e deixar secar",
      "Recolocar os filtros e verificar se tudo está encaixado corretamente",
      "Ligar o aparelho na tomada",
    ],
    materiais: [
      "Esponja (exclusiva para esta finalidade)",
      "Fibraço",
      "Detergente neutro",
      "Desincrustante",
      "Solução clorada",
      "Óculos de segurança",
      "Avental impermeável",
      "Luvas de borracha",
    ],
    monitoramento: "Observação da higienização pela gerente da produção e/ou nutricionista consultora",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização da Máquina Lava-Louças",
    codigo: "PPHO 02.09",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização da máquina de lava-louças a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos e Auxiliares de serviços gerais",
    frequencia: "Diariamente",
    instrucoes: [
      "Desligar o equipamento",
      "Retirar o dreno para que a água do tanque escorra",
      "Com o tanque vazio, retirar o filtro da bomba, os braços giratórios superiores e inferiores, os bicos de lavagem e enxague",
      "Preparar esponja com detergente neutro ou clorado",
      "Higienizar as peças, o interior e exterior da máquina com a esponja",
      "Enxaguar todas as peças",
      "Enxaguar o interior do equipamento fazendo um ciclo de lavagem",
      "Finalizar passando perflex",
    ],
    materiais: [
      "Esponja (exclusiva para esta finalidade)",
      "Detergente neutro ou clorado",
      "Pano descartável",
      "Balde",
      "Luva descartável",
    ],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização de Paredes, Portas, Maçanetas e Interruptores",
    codigo: "PPHO 02.12",
    revisao: "00",
    objetivo:
      "Descrever os procedimentos de higienização de paredes, janelas, portas, maçanetas e interruptores a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Atendente",
    frequencia: "Diariamente, de preferência no final do expediente",
    instrucoes: [
      "Colocar luvas de borracha",
      "Preparar no balde pequena quantidade de detergente neutro com água",
      "Esfregar com esponja umedecida com a solução em todas as instalações",
      "Enxaguar com água",
      "Umedecer pano descartável com solução 200 ppm e passar em todas as instalações",
      "Deixar secar naturalmente",
    ],
    materiais: [
      "Esponja",
      "Pano descartável",
      "Detergente neutro",
      "Solução de cloro 200 ppm",
      "Balde ou mangueira",
      "Luvas de borracha amarela",
    ],
    monitoramento:
      "Observação da higienização. Verificar se foi retirada toda a sujidade e produto utilizado.",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento da realização do procedimento para verificar eficácia",
  },
  {
    titulo: "Higienização do Liquidificador",
    codigo: "PPHO 02.05",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização do liquidificador e multiprocessador industrial a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos e Auxiliar de limpeza",
    frequencia: "Higienização — após o uso. Sanitização — antes de iniciar o uso",
    instrucoes: [
      "Higienização: Desligar o equipamento da parte elétrica",
      "Higienização: Lavar a tampa esfregando com esponja umedecida com água e detergente neutro",
      "Higienização: Enxaguar a tampa e deixar secar naturalmente",
      "Higienização: Desmontar as partes removíveis",
      "Higienização: Retirar resíduos grosseiros do copo com água corrente",
      "Higienização: Esfregar a parte interna e externa do copo com esponja e detergente",
      "Higienização: Enxaguar com água corrente até eliminar todo o resíduo de detergente",
      "Higienização: Deixar secar naturalmente",
      "Higienização: As partes fixas (fios e tomada) devem ser limpas a seco com pano descartável úmido",
      "Higienização: Montar o liquidificador",
      "Sanitização: Aplicar solução sanitizante sobre toda a superfície interna por pulverização ou espalhamento",
      "Sanitização: Deixar secar naturalmente antes de iniciar o uso",
      "Atenção: se o liquidificador for doméstico, realizar a limpeza do motor com pano descartável úmido",
    ],
    materiais: ["Esponja", "Detergente neutro", "Álcool 70%", "Borrifador", "EPIs"],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização de Lixeiras",
    codigo: "PPHO 02.06",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de retirada do lixo e limpeza das lixeiras a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos e/ou Auxiliar de limpeza",
    frequencia: "Diariamente e sempre que necessário",
    instrucoes: [
      "Retirar as lixeiras da área de produção para a retirada dos sacos de lixo",
      "Acondicionar os sacos em local adequado para recolhimento",
      "Esfregar com esponja específica e detergente em todas as áreas das lixeiras",
      "Enxaguar completamente para eliminar resíduos e mau cheiro",
      "Colocar um novo saco de lixo, vazio e limpo",
      "Devolver as lixeiras para o local adequado",
    ],
    materiais: [
      "Esponja (exclusiva para esta finalidade, separada e identificada no DML)",
      "Detergente",
    ],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização da Panela de Arroz",
    codigo: "PPHO 02.08",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização da panela de arroz a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos",
    frequencia: "Diariamente, após o uso ou sempre que necessário",
    instrucoes: [
      "Antes de manusear, feche o registro de gás",
      "A panela, o invólucro (parte branca) e a tampa podem ser lavados com detergente neutro",
      "Após a lavagem, secar bem as peças para evitar oxidação",
      "NUNCA lave o corpo do queimador com água",
      "Limpar regularmente os furos do queimador com escova para manter eficiência",
      "Não utilizar escovas duras na região do sensor de temperatura — se necessário, usar lixa de grão 400 com cuidado",
      "Evitar impactos no sensor de temperatura",
      "Não utilizar álcool, tíner ou produtos abrasivos",
      "Atenção: NUNCA utilize água para limpar o queimador principal",
    ],
    materiais: ["Água", "Sabão ou detergente", "Bucha dupla face", "Escova macia", "Pano limpo"],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização de Utensílios em Geral",
    codigo: "PPHO 02.04",
    revisao: "00",
    objetivo:
      "Descrever os procedimentos de higienização de utensílios em geral a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos e Auxiliar de limpeza",
    frequencia: "Diariamente e sempre que necessário",
    instrucoes: [
      "Retirar os resíduos de alimentos",
      "Esfregar com esponja e detergente neutro até que toda a superfície esteja limpa",
      "Enxaguar em água corrente até retirar todo o resíduo de detergente",
      "Colocar em recipiente limpo e higienizado",
      "Borrifar álcool 70% e deixar secar naturalmente",
      "Garantir a secagem completa antes de guardar em local protegido",
      "Na máquina de lavar louças: retirar excesso de resíduos, colocar na máquina, retirar e deixar secar naturalmente",
    ],
    materiais: ["Esponja (exclusiva para esta finalidade)", "Detergente neutro", "Álcool 70% ou outro produto desinfetante"],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização do Filtro de Água",
    codigo: "PPHO 02.02",
    revisao: "00",
    objetivo:
      "Descrever os procedimentos de higienização correta do filtro de água a fim de evitar a contaminação da água.",
    responsaveis: "Responsável pela limpeza",
    frequencia: "Semanalmente",
    instrucoes: [
      "Desligue o bebedouro da tomada",
      "Encha metade de um balde com água e detergente",
      "Imergir pano de limpeza ou esponja dupla face (lado macio) na solução e torcer",
      "Passar o pano por todo bebedouro e no fio da tomada, com movimentos retos, sempre de cima para baixo",
      "Molhar a escova na solução e utilizar ao redor do dispositivo de saída da água e acionador",
      "Passar pano com água limpa e remover toda a solução detergente",
      "Passar álcool 70% ao redor do dispositivo de saída de água, acionador e local de escoamento",
      "Lavar o suporte da pingadeira com água e detergente, enxaguar, borrifar álcool 70% e deixar secar",
      "Ligar o bebedouro na tomada",
    ],
    materiais: ["Balde", "Escova de limpeza", "Detergente neutro", "Pano descartável", "Álcool 70%"],
    monitoramento: "Observação da higienização realizada e registro nas planilhas de controle",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Verificação dos registros preenchidos pelo responsável pela higienização",
  },
  {
    titulo: "Higienização da Vitrine Expositora Sushi Case",
    codigo: "PPHO 02.03",
    revisao: "01",
    objetivo:
      "Descrever os procedimentos de higienização da Vitrine expositora Sushi Case a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos",
    frequencia: "Diariamente, no final do turno",
    instrucoes: [
      "Desligar o equipamento da parte elétrica",
      "Desmontar as partes removíveis (graminha, bandejas e porta de vidro)",
      "Lavar em água corrente para retirar os resíduos",
      "Esfregar com esponja e detergente neutro as partes removíveis e a parte interna e externa da sushi case",
      "Enxaguar",
      "Borrifar álcool 70% na graminha, bandejas, porta de vidro, parte externa e interna",
      "Deixar secar naturalmente",
      "As partes fixas (fios, tomada e motor) deverão ser limpas a seco com pano descartável úmido",
      "Após higienização, montar a vitrine",
      "Atenção: nunca deixar água no interior do equipamento para evitar contaminação",
    ],
    materiais: ["Esponja (exclusiva para o equipamento)", "Detergente neutro", "Álcool 70%", "Pano descartável"],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização do Fogão a Gás",
    codigo: "PPHO 02.14",
    revisao: "01",
    objetivo: "Descrever os procedimentos de higienização do fogão a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos",
    frequencia: "Diariamente, após o uso ou sempre que necessário",
    instrucoes: [
      "Desligar a chama do fogão e fechar a saída de gás",
      "Desmontar o fogão, retirando as partes removíveis (queimadores e grades)",
      "Lavar as partes removíveis com detergente neutro e esponja, enxaguar em água corrente",
      "Retirar o excesso de sujidades da parte fixa com esponja fibraço e detergente desincrustante se necessário",
      "Esfregar a parte fixa com esponja macia umedecida com detergente neutro e água",
      "Retirar o detergente com pano úmido e limpo",
      "Deixar secar naturalmente",
      "Montar o fogão",
    ],
    materiais: [
      "Luva de borracha",
      "Detergente neutro",
      "Detergente desincrustante",
      "Esponja de limpeza (dupla face e fibraço)",
      "Pano descartável",
    ],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento periódico da higienização",
  },
  {
    titulo: "Higienização da Fritadeira",
    codigo: "PPHO 02.16",
    revisao: "00",
    objetivo:
      "Descrever os procedimentos de higienização correta da fritadeira a fim de evitar a contaminação dos alimentos.",
    responsaveis: "Manipuladores de alimentos",
    frequencia: "Quinzenalmente ou sempre que necessitar",
    instrucoes: [
      "Retirar o óleo de dentro do equipamento",
      "Retirar o equipamento da tomada",
      "Esfregar com esponja, água e detergente neutro o interior, exterior e borrachas do equipamento",
      "Enxaguar bem com água",
      "Secar com perflex",
    ],
    materiais: ["Esponja", "Detergente neutro", "Perflex"],
    monitoramento: "Observação da higienização realizada",
    acoesCorretivas:
      "Repetição do procedimento e, se necessário, capacitação da equipe",
    verificacao: "Acompanhamento da realização do procedimento para verificar eficácia",
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPopHtml(pop: Pop) {
  const instrucoes = pop.instrucoes
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("");
  const materiais = pop.materiais
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(pop.titulo)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 30px; color: #1a1a1a; line-height: 1.5; }
  .header { border-bottom: 3px solid #e63946; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: #e63946; font-size: 22px; margin: 0 0 6px; }
  .meta { font-size: 12px; color: #666; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .info-box { background: #f5f5f5; border-radius: 6px; padding: 12px 16px; font-size: 13px; }
  .info-box strong { display: block; margin-bottom: 4px; color: #e63946; }
  h2 { font-size: 15px; color: #1a1a1a; border-left: 4px solid #e63946; padding-left: 10px; margin-top: 28px; }
  ol, ul { padding-left: 22px; }
  li { margin-bottom: 6px; font-size: 14px; }
  .footer-info { margin-top: 28px; font-size: 13px; }
  .footer-info p { margin: 4px 0; }
  .footer { margin-top: 30px; font-size: 11px; color: #999; }
</style>
</head>
<body>
  <div class="header">
    <h1>🎯 Kenkyo — ${escapeHtml(pop.titulo)}</h1>
    <div class="meta">Código: ${escapeHtml(pop.codigo)} · Revisão: ${escapeHtml(pop.revisao)}</div>
  </div>

  <div class="info-grid">
    <div class="info-box"><strong>Objetivo</strong>${escapeHtml(pop.objetivo)}</div>
    <div class="info-box"><strong>Responsáveis</strong>${escapeHtml(pop.responsaveis)}</div>
    <div class="info-box" style="grid-column: span 2;"><strong>Frequência</strong>${escapeHtml(pop.frequencia)}</div>
  </div>

  <h2>Instruções</h2>
  <ol>${instrucoes}</ol>

  <h2>Materiais Utilizados</h2>
  <ul>${materiais}</ul>

  <div class="footer-info">
    <p><strong>Monitoramento:</strong> ${escapeHtml(pop.monitoramento)}</p>
    <p><strong>Ações Corretivas:</strong> ${escapeHtml(pop.acoesCorretivas)}</p>
    <p><strong>Verificação:</strong> ${escapeHtml(pop.verificacao)}</p>
  </div>

  <div class="footer"><p>Documento importado do Notion — Central de Governança Kenkyo</p></div>
</body>
</html>`;
}

async function main() {
  const [gestor] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.profile, "gestor"))
    .limit(1);

  if (!gestor) {
    console.error("Nenhum usuário Gestor encontrado, abortando.");
    process.exit(1);
  }

  const existingTitles = new Set(
    (await db.select({ title: documents.title }).from(documents)).map(
      (d) => d.title,
    ),
  );

  for (const pop of POPS) {
    if (existingTitles.has(pop.titulo)) {
      console.log(`"${pop.titulo}" já existe, pulando.`);
      continue;
    }

    const html = renderPopHtml(pop);
    const blob = await put(
      `documentos/pop-${pop.codigo.replace(/\s+/g, "-")}-${Date.now()}.html`,
      html,
      { access: "public", contentType: "text/html" },
    );

    await db.insert(documents).values({
      title: pop.titulo,
      category: "pop",
      fileUrl: blob.url,
      createdBy: gestor.id,
    });

    console.log(`"${pop.titulo}" importado.`);
  }

  console.log("Importação de POPs de Higienização concluída.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
