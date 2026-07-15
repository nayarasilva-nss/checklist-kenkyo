import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "../lib/db";
import { documents, users } from "../lib/db/schema";

type Ingrediente = [nome: string, pesoBruto: string, pesoLiquido: string];

type Receita = {
  titulo: string;
  indiceCoccao: string;
  pesoBruto: string;
  pesoLiquido: string;
  ingredientes: Ingrediente[];
  modoPreparo: string[];
  notas: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderReceitaHtml(receita: Receita) {
  const ingredientesRows = receita.ingredientes
    .map(
      ([nome, bruto, liquido]) => `
        <tr>
          <td>${escapeHtml(nome)}</td>
          <td class="num">${escapeHtml(bruto)}</td>
          <td class="num">1</td>
          <td class="num">${escapeHtml(liquido)}</td>
        </tr>`,
    )
    .join("");

  const modoPreparoBlock = receita.modoPreparo.length
    ? `
      <h2>Modo de Preparo</h2>
      <ol>
        ${receita.modoPreparo.map((passo) => `<li>${escapeHtml(passo)}</li>`).join("")}
      </ol>`
    : "";

  const notasBlock = receita.notas.length
    ? `
      <h2>Observações</h2>
      <ul>
        ${receita.notas.map((nota) => `<li>${escapeHtml(nota)}</li>`).join("")}
      </ul>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(receita.titulo)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #222; max-width: 800px; margin: 40px auto; padding: 0 20px; }
  header { border-bottom: 3px solid #e63946; padding-bottom: 12px; margin-bottom: 24px; }
  h1 { color: #e63946; font-size: 26px; margin: 0; }
  h2 { color: #e63946; font-size: 18px; margin-top: 28px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .info-box { background: #f8f8f8; border: 1px solid #eee; border-radius: 6px; padding: 10px 14px; }
  .info-box .label { font-size: 12px; color: #888; text-transform: uppercase; }
  .info-box .value { font-size: 16px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #eee; padding: 8px 10px; text-align: left; font-size: 14px; }
  th { background: #fbeaea; color: #e63946; }
  td.num, th.num { text-align: right; }
  ol, ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
</style>
</head>
<body>
  <header><h1>${escapeHtml(receita.titulo)}</h1></header>

  <div class="info-grid">
    <div class="info-box"><div class="label">Peso Bruto</div><div class="value">${escapeHtml(receita.pesoBruto)}</div></div>
    <div class="info-box"><div class="label">Peso Líquido</div><div class="value">${escapeHtml(receita.pesoLiquido)}</div></div>
    <div class="info-box"><div class="label">Índice de Cocção</div><div class="value">${escapeHtml(receita.indiceCoccao)}</div></div>
  </div>

  <h2>Ingredientes</h2>
  <table>
    <thead>
      <tr><th>Ingrediente</th><th class="num">Peso Bruto</th><th class="num">Fator de Correção</th><th class="num">Peso Líquido</th></tr>
    </thead>
    <tbody>
      ${ingredientesRows}
    </tbody>
  </table>

  ${modoPreparoBlock}
  ${notasBlock}

  <footer>Documento importado do Livro de Receitas Kenkyo — Central de Governança Kenkyo</footer>
</body>
</html>`;
}

const RECEITAS: Receita[] = [
  {
    titulo: "Camarão Alho e Óleo",
    indiceCoccao: "0.91",
    pesoBruto: "2.19Kg",
    pesoLiquido: "2Kg",
    ingredientes: [
      ["CAMARÃO 41/50", "2Kg", "2Kg"],
      ["TEMPERO PADRÃO KENKYO", "85g", "85g"],
      ["Óleo, de Soja", "67.5ml", "67.5ml"],
      ["Sal de Mesa", "40g", "40g"],
    ],
    modoPreparo: [
      "Aqueça uma frigideira grande ou panela larga em fogo médio-alto.",
      "Adicione os 67,5 ml de óleo de soja e, assim que estiver quente, coloque os 80g de tempero padrão.",
      "Refogue o tempero por cerca de 1 a 2 minutos, mexendo bem, até liberar o aroma (sem deixar queimar o alho).",
      "Acrescente diretamente os 2kg de camarão já limpos e descongelados à panela.",
      "Misture bem para que o tempero envolva todos os camarões. Tempere com sal a gosto.",
      "Continue refogando por 5 a 7 minutos, mexendo de vez em quando, até que os camarões estejam rosados, firmes e douradinhos.",
      "Desligue o fogo e está pronto.",
    ],
    notas: ["Conservar em refrigeração por até 24h."],
  },
  {
    titulo: "Camarão Empanado 36/40",
    indiceCoccao: "0.59",
    pesoBruto: "222g",
    pesoLiquido: "130.98g",
    ingredientes: [
      ["CAMARÃO 21/25", "150g", "150g"],
      ["MASSA DE EMPANAR", "50g", "50g"],
      ["Farinha Panko, Romariz", "20g", "20g"],
      ["TEMPERO SHIO-KOSHO", "2g", "2g"],
    ],
    modoPreparo: [
      "Preparar o camarão: higienizar, descascar e retirar a veia dorsal. Secar bem.",
      "Temperar com shio-kosho e deixar agir por alguns minutos.",
      "Empanar em duas camadas: passar na massa de empanar; finalizar cobrindo com farinha panko, pressionando levemente para fixar.",
      "Fritura: aquecer óleo a 170–180 °C e fritar até dourar.",
      "Escorrer em papel absorvente.",
    ],
    notas: [
      "Rendimento: 30 g de produto pronto (por unidade).",
      "Textura final: crocante por fora, suculento por dentro.",
      "Aplicações: entradas, combinados premium, delivery.",
    ],
  },
  {
    titulo: "Camarão Empanado 36/40 (unidade)",
    indiceCoccao: "1",
    pesoBruto: "36g",
    pesoLiquido: "36g",
    ingredientes: [
      ["Camarão, seco", "23g", "23g"],
      ["MASSA DE EMPANAR", "6g", "6g"],
      ["Farinha Panko, Romariz", "4g", "4g"],
      ["TEMPERO SHIO-KOSHO", "3g", "3g"],
    ],
    modoPreparo: [
      "Preparar o camarão: higienizar, descascar e retirar a veia dorsal. Secar bem.",
      "Temperar com shio-kosho (3 g) e deixar agir por alguns minutos.",
      "Empanar em duas camadas: passar na massa de empanar (6 g); finalizar cobrindo com farinha panko (4 g), pressionando levemente para fixar.",
      "Fritura: aquecer óleo a 170–180 °C e fritar até dourar.",
      "Escorrer em papel absorvente.",
    ],
    notas: [
      "Rendimento: 30 g de produto pronto (por unidade).",
      "Textura final: crocante por fora, suculento por dentro.",
      "Aplicações: entradas, combinados premium, delivery.",
    ],
  },
  {
    titulo: "Ceviche de Salmão",
    indiceCoccao: "0",
    pesoBruto: "403g",
    pesoLiquido: "403g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "280g", "280g"],
      ["MOLHO CÍTRICO KENKYO", "75ml", "75ml"],
      ["CEBOLA ROXA", "30g", "30g"],
      ["MIX/CONSERVA DE PIMENTA", "12g", "12g"],
      ["Cebolinha, Crua", "6g", "6g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em cubos uniformes.",
      "Misturar em um bowl com a cebola, o mix de pimentas e a cebolinha fresca.",
      "Adicionar o molho cítrico (250 ml) e envolver bem até integrar os sabores.",
      "Deixar marinar por alguns minutos antes de servir.",
    ],
    notas: [
      "Textura final: peixe fresco e firme, acidez equilibrada, crocância da cebola, frescor da cebolinha.",
      "Armazenamento: manter sob refrigeração (0–5 °C), validade máxima de 24h após preparo.",
      "Aplicações: entradas, combinados especiais, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Ceviche de Tilápia",
    indiceCoccao: "0.7",
    pesoBruto: "423g",
    pesoLiquido: "300g",
    ingredientes: [
      ["Tilápia, Crua", "300g", "300g"],
      ["MOLHO CÍTRICO KENKYO", "75ml", "75ml"],
      ["CEBOLA ROXA", "30g", "30g"],
      ["MIX/CONSERVA DE PIMENTA", "12g", "12g"],
      ["Cebolinha, Crua", "6g", "6g"],
    ],
    modoPreparo: [
      "Cortar a tilápia fresca em cubos uniformes.",
      "Misturar em um bowl com a cebola, o mix de pimentas e a cebolinha fresca.",
      "Adicionar o molho cítrico (250 ml) e envolver bem até integrar os sabores.",
      "Deixar marinar por alguns minutos antes de servir.",
    ],
    notas: [
      "Rendimento: aproximadamente 1,4 kg de ceviche pronto.",
      "Textura final: peixe fresco e firme, acidez equilibrada, crocância da cebola, frescor da cebolinha.",
      "Armazenamento: manter sob refrigeração (0–5 °C), validade máxima de 24h após preparo.",
      "Aplicações: entradas, combinados especiais, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Ceviche do Mar",
    indiceCoccao: "0.7",
    pesoBruto: "429g",
    pesoLiquido: "300.29g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "86g", "86g"],
      ["Tilápia, Crua", "80g", "80g"],
      ["CAMARÃO ALHO E ÓLEO", "80g", "80g"],
      ["MOLHO CÍTRICO KENKYO", "75ml", "75ml"],
      ["Polvo", "60g", "60g"],
      ["CEBOLA ROXA", "30g", "30g"],
      ["MIX/CONSERVA DE PIMENTA", "12g", "12g"],
      ["Cebolinha, Crua", "6g", "6g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em cubos uniformes.",
      "Misturar em um bowl com a cebola, o mix de pimentas e a cebolinha fresca.",
      "Adicionar o molho cítrico (250 ml) e envolver bem até integrar os sabores.",
      "Deixar marinar por alguns minutos antes de servir.",
    ],
    notas: [
      "Rendimento: aproximadamente 1,4 kg de ceviche pronto.",
      "Textura final: salmão fresco e firme, acidez equilibrada, crocância da cebola, frescor da cebolinha.",
      "Armazenamento: manter sob refrigeração (0–5 °C), validade máxima de 24h após preparo.",
      "Aplicações: entradas, combinados especiais, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Ebi Amêndoas",
    indiceCoccao: "1",
    pesoBruto: "208g",
    pesoLiquido: "208g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["CAMARÃO ALHO E ÓLEO", "48g", "48g"],
      ["Queijo Cream Cheese", "40g", "40g"],
      ["CALDA DE MARACUJA", "24g", "24g"],
      ["Amêndoa", "16g", "16g"],
    ],
    modoPreparo: [
      "Abrir o salmão em lâmina de 10 g.",
      "Rechear com cream cheese (5 g) e camarão alho e óleo (6 g).",
      "Enrolar no formato de sushi (estilo joy enrolado).",
      "Maçaricar levemente o camarão para realçar sabor e aroma.",
      "Finalizar com sweet chili (3 g) e crispy de alho-poró (3 g) no topo.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvente, recheio cremoso, toque defumado do maçarico, crocância do crispy e dulçor picante do sweet chili.",
      "Armazenamento: até no máximo 24h entre 0 e -5 c°.",
      "Aplicações: combinados especiais, rodízio premium, omakase criativo.",
      "Valores da receita para 8 unidades.",
    ],
  },
  {
    titulo: "Ebi Pipoca (Delivery)",
    indiceCoccao: "0.87",
    pesoBruto: "226g",
    pesoLiquido: "196.62g",
    ingredientes: [
      ["CAMARÃO 41/50", "120g", "120g"],
      ["MOLHO DO EBI PIPOCA", "60g", "60g"],
      ["MASSA DE TEMPURÁ (PRONTA PARA EMPANAR)", "32g", "32g"],
      ["Farinha, de Trigo", "10g", "10g"],
      ["TEMPERO SHIO-KOSHO", "4g", "4g"],
    ],
    modoPreparo: [
      "Preparar o camarão: higienizar, descascar e retirar a veia do dorso.",
      "Temperar com shio-kosho (4 g) para realçar o sabor.",
      "Empanar em duas etapas: passar os camarões primeiro na farinha de trigo (10 g); depois mergulhar na massa de tempurá (32 g).",
      "Fritar em óleo quente (170–180 °C) até ficarem dourados e crocantes.",
      "Escorrer em papel absorvente para retirar o excesso de óleo.",
      "Misturar os camarões fritos ao molho de ebi pipoca (60 g).",
      "Finalizar com ovas black (3 g) para contraste e elegância.",
    ],
    notas: [],
  },
  {
    titulo: "Ebi Sakana",
    indiceCoccao: "1",
    pesoBruto: "216g",
    pesoLiquido: "216g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["CAMARÃO ALHO E ÓLEO", "48g", "48g"],
      ["Queijo Cream Cheese", "40g", "40g"],
      ["MOLHO SWEET CHILLI", "24g", "24g"],
      ["CRISPY DE ALHO PORÓ", "24g", "24g"],
    ],
    modoPreparo: [
      "Abrir o salmão em lâmina de 10 g.",
      "Rechear com cream cheese (5 g) e camarão alho e óleo (6 g).",
      "Enrolar no formato de sushi (estilo joy enrolado).",
      "Maçaricar levemente o camarão para realçar sabor e aroma.",
      "Finalizar com sweet chili (3 g) e crispy de alho-poró (3 g) no topo.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvente, recheio cremoso, toque defumado do maçarico, crocância do crispy e dulçor picante do sweet chili.",
      "Armazenamento: até no máximo 24h entre 0 e -5 c°.",
      "Aplicações: combinados especiais, rodízio premium, omakase criativo.",
      "Valores da receita para 8 unidades.",
    ],
  },
  {
    titulo: "Gyoza",
    indiceCoccao: "1",
    pesoBruto: "176g",
    pesoLiquido: "176g",
    ingredientes: [
      ["GYOZA BASE", "120g", "120g"],
      ["MOLHO PONZÚ", "48ml", "48ml"],
      ["MIX DE GERGELIM TORRADO", "8g", "8g"],
    ],
    modoPreparo: [
      "Descongelamento (se necessário): caso o gyoza esteja congelado, deixe descongelar por 10 a 15 minutos em temperatura ambiente antes do preparo.",
      "Selagem: aqueça uma frigideira antiaderente em fogo médio com um fio de óleo vegetal. Posicione os gyozas com a base voltada para baixo, sem sobrepor. Deixe dourar por cerca de 2 minutos, até a parte inferior ficar levemente crocante e dourada.",
      "Cozimento no vapor: adicione aproximadamente 50 ml de água (suficiente para cobrir o fundo da frigideira). Tampe imediatamente e cozinhe por 3 a 4 minutos, até que a água evapore completamente e o gyoza esteja cozido por dentro.",
      "Finalização: retire a tampa e deixe mais 30 segundos para reativar a crocância da base.",
      "Montagem: disponha os gyozas no prato, regue com molho ponzú e finalize com uma pitada de gergelim torrado por cima.",
    ],
    notas: [],
  },
  {
    titulo: "Harumaki de Queijo",
    indiceCoccao: "1",
    pesoBruto: "120g",
    pesoLiquido: "120g",
    ingredientes: [
      ["QUEIJO MUSSARELA", "60g", "60g"],
      ["Massa de Harumaki/Rolinho primavera", "52g", "52g"],
      ["MASSA DE EMPANAR", "8g", "8g"],
    ],
    modoPreparo: [
      "Montagem do recheio: disponha 15 g de queijo mussarela ralado no centro de uma massa de harumaki, posicionando-a em formato de losango (com uma ponta voltada para você).",
      "Fechamento/Enrolamento (técnica correta): dobre a ponta inferior da massa sobre o recheio. Em seguida, dobre as duas laterais em direção ao centro, mantendo o recheio firme. Enrole cuidadosamente até o final, pressionando levemente para retirar o ar interno. Utilize a massa de empanar dissolvida em um pouco de água como \"cola\" para selar a ponta final e evitar que abra durante a fritura.",
      "Fritura: aqueça o óleo a 170 °C e frite o harumaki até ficar dourado e crocante, cerca de 2 a 3 minutos. Retire e escorra em papel toalha para remover o excesso de óleo.",
      "Finalização: sirva quente, garantindo que o queijo esteja derretido e a massa crocante.",
    ],
    notas: ["Por unidade."],
  },
  {
    titulo: "Hot Couve Crispy",
    indiceCoccao: "1",
    pesoBruto: "287g",
    pesoLiquido: "287g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["FILÉ DE SALMÃO", "65g", "65g"],
      ["Queijo Cream Cheese", "62g", "62g"],
      ["CRISPY DE COUVE", "30g", "30g"],
      ["MASSA DE EMPANAR", "23g", "23g"],
      ["MOLHO REDUÇÃO DE VINHO", "12ml", "12ml"],
      ["Farinha Panko, Romariz", "10g", "10g"],
      ["MIX DE GERGELIM TORRADO", "5g", "5g"],
    ],
    modoPreparo: [
      "Abrir o shari sobre a nori na esteira e dispor o filé de salmão e o cream cheese.",
      "Enrolar firmemente o sushi, garantindo fechamento uniforme.",
      "Passar o enrolado na massa de empanar e depois na farinha panko.",
      "Fritar em óleo quente (170–180 °C) até dourar levemente.",
      "Cortar em 10 unidades iguais.",
      "Finalizar com cream cheese e molho redução de vinho.",
      "Finalizar com o mix de gergelim e couve crispy para crocância e contraste.",
    ],
    notas: [],
  },
  {
    titulo: "Hot Especial",
    indiceCoccao: "1",
    pesoBruto: "337g",
    pesoLiquido: "337g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["FILÉ DE SALMÃO", "65g", "65g"],
      ["Queijo Cream Cheese", "62g", "62g"],
      ["CAMARÃO ALHO E ÓLEO", "50g", "50g"],
      ["CRISPY DE ALHO PORÓ", "30g", "30g"],
      ["MASSA DE EMPANAR", "23g", "23g"],
      ["MOLHO SWEET CHILLI", "12g", "12g"],
      ["Farinha Panko, Romariz", "10g", "10g"],
      ["MIX DE GERGELIM TORRADO", "5g", "5g"],
    ],
    modoPreparo: [
      "Abrir o shari sobre a folha de nori posicionada na esteira.",
      "Dispor o filé de salmão e o cream cheese sobre o arroz.",
      "Enrolar firmemente o sushi, garantindo fechamento uniforme.",
      "Passar o enrolado na massa de empanar e depois na farinha panko.",
      "Fritar em óleo quente (170–180 °C) até dourar levemente.",
      "Cortar em 10 unidades iguais.",
      "Colocar uma porção de cream cheese sobre cada unidade.",
      "Dispor o camarão alho e óleo sobre o cream cheese.",
      "Finalizar com molho sweet chili, mix de gergelim e alho-poró crispy por cima.",
    ],
    notas: [],
  },
  {
    titulo: "Hot Filadélfia",
    indiceCoccao: "1",
    pesoBruto: "263g",
    pesoLiquido: "263g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["FILÉ DE SALMÃO", "65g", "65g"],
      ["Queijo Cream Cheese", "62g", "62g"],
      ["MASSA DE EMPANAR", "23g", "23g"],
      ["MOLHO TERIYAKI", "12ml", "12ml"],
      ["Farinha Panko, Romariz", "10g", "10g"],
      ["Alga, Nori", "6g", "6g"],
      ["MIX DE GERGELIM TORRADO", "5g", "5g"],
    ],
    modoPreparo: [
      "Abrir o shari sobre a nori na esteira e dispor o filé de salmão e o cream cheese.",
      "Enrolar firmemente o sushi, garantindo fechamento uniforme.",
      "Passar o enrolado na massa de empanar e depois na farinha panko.",
      "Fritar em óleo quente (170–180 °C) até dourar levemente.",
      "Cortar em 10 unidades iguais.",
      "Finalizar com cream cheese, molho teriyaki e com o mix de gergelim.",
    ],
    notas: [],
  },
  {
    titulo: "Hot Haru",
    indiceCoccao: "1",
    pesoBruto: "298g",
    pesoLiquido: "298g",
    ingredientes: [
      ["PATÊ GRELHADO", "200g", "200g"],
      ["Queijo Cream Cheese", "40g", "40g"],
      ["MOLHO SWEET CHILLI", "30g", "30g"],
      ["Massa de Harumaki/Rolinho primavera", "13g", "13g"],
      ["Limão", "10g", "10g"],
      ["MIX DE GERGELIM TORRADO", "5g", "5g"],
    ],
    modoPreparo: [
      "Dispor o patê grelhado sobre a massa harumaki e enrolar firmemente.",
      "Cortar os rolinhos antes de fritar, garantindo tamanhos uniformes.",
      "Fritar em óleo quente (170–180 °C) até ficarem dourados e crocantes.",
      "Dispor as peças em prato alinhado.",
      "Finalizar com cream cheese, fatia fina de limão e molho sweet chili.",
      "Polvilhar o mix de gergelim para acabamento e textura.",
    ],
    notas: [],
  },
  {
    titulo: "Hot Tartare",
    indiceCoccao: "1",
    pesoBruto: "318g",
    pesoLiquido: "318g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "120g", "120g"],
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["Queijo Cream Cheese", "62g", "62g"],
      ["MASSA DE EMPANAR", "23g", "23g"],
      ["MOLHO TERIYAKI", "12ml", "12ml"],
      ["Farinha Panko, Romariz", "10g", "10g"],
      ["Alga, Nori", "6g", "6g"],
      ["MIX DE GERGELIM TORRADO", "5g", "5g"],
    ],
    modoPreparo: [
      "Abrir o shari sobre a nori na esteira e dispor o filé de salmão e o cream cheese.",
      "Enrolar firmemente o sushi, garantindo fechamento uniforme.",
      "Passar o enrolado na massa de empanar e depois na farinha panko.",
      "Fritar em óleo quente (170–180 °C) até dourar levemente.",
      "Cortar em 10 unidades iguais.",
      "Finalizar com cream cheese, molho teriyaki e com o mix de gergelim.",
    ],
    notas: [],
  },
  {
    titulo: "Iscas de Tilápia",
    indiceCoccao: "0.88",
    pesoBruto: "491g",
    pesoLiquido: "432.08g",
    ingredientes: [
      ["Tilápia, Crua", "350g", "350g"],
      ["MASSA DE EMPANAR", "80g", "80g"],
      ["Farinha Panko, Romariz", "51g", "51g"],
      ["TEMPERO SHIO-KOSHO", "10g", "10g"],
    ],
    modoPreparo: [
      "Cortar a tilápia em iscas (22g).",
      "Temperar com shio-kosho (3 g) e deixar agir por alguns minutos.",
      "Passar na massa de empanar (6 g).",
      "Finalizar cobrindo com farinha panko (4 g), pressionando levemente para fixar.",
      "Fritura: aquecer óleo a 170–180 °C e fritar até dourar.",
      "Escorrer em papel absorvente.",
    ],
    notas: [
      "Rendimento: 30 g de produto pronto (por unidade).",
      "Textura final: crocante por fora, suculento por dentro.",
      "Aplicações: entradas, combinados premium, delivery.",
    ],
  },
  {
    titulo: "Joy Amêndoas",
    indiceCoccao: "1",
    pesoBruto: "192g",
    pesoLiquido: "192g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["Queijo Cream Cheese", "64g", "64g"],
      ["Amêndoa, Assada À Seco Sem Sal", "24g", "24g"],
      ["MOLHO REDUÇÃO DE VINHO", "24ml", "24ml"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em lâmina de 10 g.",
      "Modelar em formato de \"cestinha\" (joy).",
      "Rechear com 8 g de cream cheese centralizado.",
      "Dispor em prato adequado, mantendo padrão Kenkyo.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvendo cream cheese cremoso.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: combinados, rodízio, omakase e entradas especiais.",
    ],
  },
  {
    titulo: "Joy de Maracujá",
    indiceCoccao: "1",
    pesoBruto: "168g",
    pesoLiquido: "168g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["Queijo Cream Cheese", "64g", "64g"],
      ["CALDA DE MARACUJA", "24g", "24g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em lâmina de 10 g.",
      "Modelar em formato de \"cestinha\" (joy).",
      "Rechear com 8 g de cream cheese.",
      "Finalizar com 3 g de calda de maracujá sobre o recheio.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvendo cream cheese cremoso, equilibrado pelo dulçor ácido da calda de maracujá.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: combinados criativos, rodízio premium, omakase diferenciado.",
    ],
  },
  {
    titulo: "Joy Filadélfia",
    indiceCoccao: "1",
    pesoBruto: "144g",
    pesoLiquido: "144g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["Queijo Cream Cheese", "64g", "64g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em lâmina de 10 g.",
      "Modelar em formato de \"cestinha\" (joy).",
      "Rechear com 8 g de cream cheese centralizado.",
      "Dispor em prato adequado, mantendo padrão Kenkyo.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvendo cream cheese cremoso.",
      "Armazenamento: refrigerado entre 2-5 c°.",
    ],
  },
  {
    titulo: "Joy Morango",
    indiceCoccao: "1",
    pesoBruto: "168g",
    pesoLiquido: "168g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["Queijo Cream Cheese", "64g", "64g"],
      ["CALDA DE MORANGO", "24g", "24g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em lâmina de 10 g.",
      "Modelar em formato de \"cestinha\" (joy).",
      "Rechear com 8 g de cream cheese.",
      "Finalizar com 3 g de calda de morango sobre o recheio.",
    ],
    notas: [],
  },
  {
    titulo: "Joy Passion",
    indiceCoccao: "1",
    pesoBruto: "162g",
    pesoLiquido: "162g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["Queijo Cream Cheese", "64g", "64g"],
      ["Mousse de maracujá", "18g", "18g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em lâmina de 10 g.",
      "Modelar em formato de \"cestinha\" (joy).",
      "Rechear com 8 g de cream cheese centralizado.",
      "Dispor em prato adequado, mantendo padrão Kenkyo.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvendo cream cheese cremoso.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: combinados, rodízio, omakase e entradas especiais.",
    ],
  },
  {
    titulo: "Joy Patê de Salmão",
    indiceCoccao: "1",
    pesoBruto: "176g",
    pesoLiquido: "176g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "112g", "112g"],
      ["Queijo Cream Cheese", "64g", "64g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em lâmina de 10 g.",
      "Modelar em formato de \"cestinha\" (joy).",
      "Rechear com 8 g de cream cheese centralizado.",
      "Dispor em prato adequado, mantendo padrão Kenkyo.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvendo cream cheese cremoso.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: combinados, rodízio, omakase e entradas especiais.",
    ],
  },
  {
    titulo: "Julieta Oreo",
    indiceCoccao: "1",
    pesoBruto: "84g",
    pesoLiquido: "84g",
    ingredientes: [
      ["MOUSSE DE LIMÃO", "50g", "50g"],
      ["GOIABADA", "30g", "30g"],
      ["Biscoito moído sabor chocolate, OREO/NEGRESCO", "4g", "4g"],
    ],
    modoPreparo: [
      "Base: em um recipiente ou taça, adicione o mousse de limão, nivelando a superfície para formar a base da sobremesa.",
      "Camada de goiabada: corte a goiabada em fatias finas e modele-as em formato de flor, enrolando as tiras ou sobrepondo-as em espiral. Posicione sobre o mousse, centralizando no recipiente.",
      "Finalização: polvilhe Oreo triturado por cima, cobrindo parcialmente a goiabada para criar contraste de textura e sabor.",
      "Apresentação: sirva gelado, destacando o formato de flor da goiabada no topo.",
    ],
    notas: [],
  },
  {
    titulo: "Maionese Kenkyo",
    indiceCoccao: "1",
    pesoBruto: "1.58Kg",
    pesoLiquido: "1.58Kg",
    ingredientes: [
      ["Óleo, de Soja", "1L", "1L"],
      ["Leite, de Vaca, Integral", "500ml", "500ml"],
      ["Limão", "50ml", "50ml"],
      ["Missô", "25g", "25g"],
    ],
    modoPreparo: [
      "Bata no liquidificador o leite, o limão e o missô.",
      "Adicione o óleo aos poucos, em fio, até a textura ficar firme e cremosa.",
    ],
    notas: ["Validade: até 5 dias refrigerada (0–5 °C)."],
  },
  {
    titulo: "Massa de Empanar",
    indiceCoccao: "1",
    pesoBruto: "2.5Kg",
    pesoLiquido: "2.5Kg",
    ingredientes: [
      ["ÁGUA FILTRADA", "1.5L", "1.5L"],
      ["Farinha, de Trigo", "1Kg", "1Kg"],
    ],
    modoPreparo: ["Misture os ingredientes em um bowl."],
    notas: [],
  },
  {
    titulo: "Massa de Tempurá (Pronta para Empanar)",
    indiceCoccao: "1",
    pesoBruto: "1Kg",
    pesoLiquido: "1Kg",
    ingredientes: [
      ["MASSA DE TEMPURA", "500g", "500g"],
      ["Água Mineral", "250ml", "250ml"],
      ["ÁGUA FILTRADA", "250ml", "250ml"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Molho Cítrico Kenkyo",
    indiceCoccao: "0.96",
    pesoBruto: "1.87L",
    pesoLiquido: "1.8L",
    ingredientes: [
      ["Limão", "1L", "1L"],
      ["Laranja, Suco de Laranja", "750ml", "750ml"],
      ["Sal de Mesa", "33g", "33g"],
      ["MOLHO SWEET CHILLI", "30g", "30g"],
      ["BLEND/MIX DE OLÉO DE GERGELIM", "22ml", "22ml"],
      ["HONDASHI", "20g", "20g"],
      ["Molho de Pimenta", "10g", "10g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Molho do Ebi Pipoca",
    indiceCoccao: "1.35",
    pesoBruto: "1.85Kg",
    pesoLiquido: "2.5Kg",
    ingredientes: [
      ["Óleo, de Soja", "900ml", "900ml"],
      ["Ovo, de Galinha, Cru", "500g", "500g"],
      ["CONSERVA KENKYO (DE ALHO PORÓ)", "170g", "170g"],
      ["MOLHO SWEET CHILLI", "150g", "150g"],
      ["Limão", "80ml", "80ml"],
      ["OVAS TOBIKO BLACK", "50g", "50g"],
    ],
    modoPreparo: [
      "Base – no liquidificador, bater a conserva Kenkyo, o suco de limão e os ovos até ficar homogêneo.",
      "Emulsão – acrescentar o óleo de soja em fio até atingir ponto de maionese firme.",
      "Finalização – transferir a maionese para bowl inox limpo, adicionar o Sweet Chili e as ovas black, misturando delicadamente com fuê ou espátula até homogeneizar.",
      "Porcionar em potes herméticos e identificar com nome do produto, data de preparo e validade.",
      "Armazenar sob refrigeração (0–5 °C).",
    ],
    notas: [
      "Tempo médio de preparo aproximado: 40 min.",
      "Rendimento: aproximadamente 2,6 kg de molho pronto.",
      "Porcionamento sugerido: potes herméticos de 500 g a 1 kg.",
      "Textura: cremosa, firme, levemente granulada pelas ovas.",
      "Sabor: adocicado do Sweet Chili, fresco e levemente picante, equilibrado pela conserva Kenkyo.",
      "Validade: até 5 dias refrigerado (0–5 °C).",
      "Armazenamento: pote hermético, sob refrigeração.",
      "Aplicações: Ebi Pipoca, Shiromi Pipoca e frituras especiais Kenkyo.",
    ],
  },
  {
    titulo: "Molho Gorgonzola",
    indiceCoccao: "1",
    pesoBruto: "435g",
    pesoLiquido: "435g",
    ingredientes: [
      ["Queijo Azul", "100g", "100g"],
      ["Queijo, Mozarela", "100g", "100g"],
      ["Cebola, Crua", "100g", "100g"],
      ["MARGARINA COM SAL", "70g", "70g"],
      ["Bebida Alcoólica, Vinho de Mesa, Branco", "50ml", "50ml"],
      ["TEMPERO PADRÃO KENKYO", "15g", "15g"],
    ],
    modoPreparo: [
      "Em uma panela, derreter a manteiga em fogo médio.",
      "Adicionar o tempero padrão, a cebola branca picada e a cebolinha, refogando até dourar.",
      "Acrescentar o queijo gorgonzola e a mussarela, mexendo até começarem a derreter.",
      "Adicionar o vinho branco e deixar evaporar parcialmente.",
      "Finalizar com o creme de leite em fogo baixo, mexendo até obter um molho cremoso e homogêneo.",
    ],
    notas: [
      "Textura final: cremosa, lisa, levemente encorpada.",
      "Armazenamento: em vasilha tampada sob refrigeração (0–5 °C).",
      "Validade: até 3 dias refrigerado.",
    ],
  },
  {
    titulo: "Molho Tártaro",
    indiceCoccao: "0.72",
    pesoBruto: "1.73Kg",
    pesoLiquido: "1.25Kg",
    ingredientes: [
      ["Óleo, de Soja", "900ml", "900ml"],
      ["Leite, de Vaca, Integral", "500ml", "500ml"],
      ["CONSERVA/BASE DO MOLHO TARTARO", "250g", "250g"],
      ["Limão", "50ml", "50ml"],
      ["Missô", "25g", "25g"],
    ],
    modoPreparo: [
      "Bata no liquidificador o leite, o limão e o missô.",
      "Adicione o óleo aos poucos, em fio, até a textura ficar firme e cremosa.",
      "Coloque a maionese em um refratário e, com ajuda de um fuê ou colher, misture com a conserva de molho tártaro.",
    ],
    notas: [],
  },
  {
    titulo: "Mousse de Limão",
    indiceCoccao: "1",
    pesoBruto: "1.5Kg",
    pesoLiquido: "1.5Kg",
    ingredientes: [
      ["Leite, Condensado", "1Kg", "1Kg"],
      ["Queijo Cream Cheese", "300g", "300g"],
      ["Limão", "200ml", "200ml"],
    ],
    modoPreparo: [
      "Coloque todos os ingredientes juntos no liquidificador: leite condensado, suco de limão e cream cheese.",
      "Bata por 2 a 3 minutos em potência alta, até obter uma mistura bem cremosa e homogênea.",
      "Transfira para taças individuais ou um refratário grande.",
      "Leve à geladeira até a mousse firmar completamente.",
    ],
    notas: [
      "Geladeira: manter refrigerado a no máximo 5 °C, bem tampado (com plástico filme ou tampa).",
      "Validade: consumir em até 5 dias.",
      "Congelamento: não recomendado, pois pode alterar a textura e separar os ingredientes ao descongelar.",
    ],
  },
  {
    titulo: "Mousse de Maçã Verde",
    indiceCoccao: "1",
    pesoBruto: "650g",
    pesoLiquido: "650g",
    ingredientes: [
      ["Queijo Cream Cheese", "300g", "300g"],
      ["XAROPE DE MAÇÃ VERDE MONIN", "250ml", "250ml"],
      ["Creme de Leite", "100g", "100g"],
    ],
    modoPreparo: [
      "Coloque todos os ingredientes juntos no liquidificador: cream cheese, creme de leite e xarope Monin de maçã verde.",
      "Bata por 2 a 3 minutos em velocidade alta, até a mistura ficar bem cremosa, lisa e emulsionada.",
      "Distribua em taças ou um refratário.",
      "Leve à geladeira até a mousse ganhar firmeza.",
    ],
    notas: [
      "Geladeira: manter refrigerado (até 5 °C), coberto com tampa ou filme plástico.",
      "Validade: consumir em até 5 dias.",
      "Congelamento: não recomendado, pois a textura pode se separar e perder a cremosidade ao descongelar.",
    ],
  },
  {
    titulo: "Niguiri de Atum",
    indiceCoccao: "1",
    pesoBruto: "124g",
    pesoLiquido: "124g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "64g", "64g"],
      ["Peixe, Atum, Fresco, Cru", "60g", "60g"],
    ],
    modoPreparo: [
      "Modelar o shari em formato oval (16 g).",
      "Cortar uma fatia de atum fresco (15 g), mantendo espessura uniforme.",
      "Dispor o atum sobre o arroz, pressionando suavemente para fixar.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: arroz firme, atum fresco e úmido.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: combinados, rodízio e omakase.",
    ],
  },
  {
    titulo: "Niguiri de Salmão",
    indiceCoccao: "1",
    pesoBruto: "120g",
    pesoLiquido: "120g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "64g", "64g"],
      ["FILÉ DE SALMÃO", "56g", "56g"],
    ],
    modoPreparo: [
      "Cortar uma fatia de salmão (14 g), mantendo textura e proporção adequada.",
      "Modelar o Shari (16 g) sobre a fatia de salmão.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: arroz firme, mas macio; peixe fresco e úmido.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: compõe combinados, rodízio e omakase.",
    ],
  },
  {
    titulo: "Niguiri de Salmão Selado",
    indiceCoccao: "1",
    pesoBruto: "156g",
    pesoLiquido: "156g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "64g", "64g"],
      ["FILÉ DE SALMÃO", "56g", "56g"],
      ["Queijo Cream Cheese", "12g", "12g"],
      ["MOLHO TERIYAKI", "8ml", "8ml"],
      ["Cebolinha, Crua", "8g", "8g"],
      ["MIX DE GERGELIM TORRADO", "8g", "8g"],
    ],
    modoPreparo: [
      "Modelar o shari em formato de base oval (16 g).",
      "Cortar uma fatia de salmão (14 g), mantendo textura e proporção adequada.",
      "Dispor o salmão sobre o arroz, pressionando suavemente para fixar.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: arroz firme, mas macio; peixe fresco e úmido.",
      "Armazenamento: consumo imediato; não recomendado armazenar montado.",
      "Aplicações: compõe combinados, rodízio e omakase.",
    ],
  },
  {
    titulo: "Niguiri de Salmão Trufado",
    indiceCoccao: "1",
    pesoBruto: "136g",
    pesoLiquido: "136g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "64g", "64g"],
      ["FILÉ DE SALMÃO", "56g", "56g"],
      ["AZEITE TRUFADO", "8ml", "8ml"],
      ["RASPAS DE LIMÃO SICILIANO", "8g", "8g"],
    ],
    modoPreparo: [
      "Modelar o shari em formato oval (16 g).",
      "Cortar o salmão fresco (14 g) em lâmina fina e uniforme.",
      "Dispor o salmão sobre o arroz, pressionando suavemente para fixar.",
      "Finalizar com azeite trufado regado sobre o salmão.",
      "Salpicar raspas de limão siciliano para realçar aroma e frescor.",
    ],
    notas: [
      "Rendimento: 1 unidade.",
      "Textura final: arroz firme, salmão delicado, aroma intenso da trufa e frescor cítrico.",
      "Aplicações: pratos premium, combinados especiais, omakase exclusivo.",
    ],
  },
  {
    titulo: "Niguiri de Tilápia e Ovas Black",
    indiceCoccao: "1",
    pesoBruto: "120g",
    pesoLiquido: "120g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "64g", "64g"],
      ["Tilápia, Crua", "48g", "48g"],
      ["OVAS TOBIKO BLACK", "8g", "8g"],
    ],
    modoPreparo: [
      "Modelar o shari em formato oval (16 g).",
      "Cortar a tilápia fresca em lâmina fina (12 g), mantendo uniformidade.",
      "Dispor a tilápia sobre o arroz, pressionando suavemente.",
      "Finalizar com 2 g de ovas black sobre a tilápia.",
    ],
    notas: [
      "Textura final: arroz firme, peixe fresco e úmido, contraste crocante das ovas.",
      "Aplicações: combinados especiais, rodízio e omakase.",
    ],
  },
  {
    titulo: "Niguiri Skin",
    indiceCoccao: "1",
    pesoBruto: "88g",
    pesoLiquido: "88g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "64g", "64g"],
      ["PELE DE SALMÃO FRITA (SKIN)", "20g", "20g"],
      ["Alga, Nori", "4g", "4g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Patê de Salmão",
    indiceCoccao: "1",
    pesoBruto: "1.43Kg",
    pesoLiquido: "1.43Kg",
    ingredientes: [
      ["FILÉ DE SALMÃO", "1Kg", "1Kg"],
      ["Queijo Cream Cheese", "300g", "300g"],
      ["MOLHO PONZÚ", "100ml", "100ml"],
      ["Cebolinha, Crua", "30g", "30g"],
    ],
    modoPreparo: [
      "Coloque o salmão no moedor.",
      "Adicione ponzú, cebolinha e cream cheese.",
      "Misture bem.",
    ],
    notas: [],
  },
  {
    titulo: "Patê Grelhado",
    indiceCoccao: "1",
    pesoBruto: "1Kg",
    pesoLiquido: "1Kg",
    ingredientes: [
      ["Tilápia, Crua", "600g", "600g"],
      ["Peixe, Atum, Fresco, Cru", "200g", "200g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Pele de Salmão Frita (Skin)",
    indiceCoccao: "1",
    pesoBruto: "100g",
    pesoLiquido: "100g",
    ingredientes: [["PELE DE SALMÃO", "100g", "100g"]],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Petit Gateau",
    indiceCoccao: "1",
    pesoBruto: "225g",
    pesoLiquido: "225g",
    ingredientes: [
      ["SORVETE DE CREME", "140ml", "140ml"],
      ["PETIT GATEAU (CAIXINHA)", "60g", "60g"],
      ["Morango, Cru", "25g", "25g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Sashimi de Salmão Trufado",
    indiceCoccao: "1",
    pesoBruto: "107g",
    pesoLiquido: "107g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "90g", "90g"],
      ["RASPAS DE LIMÃO SICILIANO", "12g", "12g"],
      ["AZEITE TRUFADO", "5ml", "5ml"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em fatia de 15 g, mantendo espessura uniforme.",
      "Dispor em prato adequado, com apresentação elegante.",
      "Regar com azeite trufado (2 g).",
      "Finalizar com raspas de limão siciliano (2 g) para frescor aromático.",
    ],
    notas: [
      "Rendimento: 6 unidades.",
      "Textura final: lâmina delicada e fresca, aroma intenso da trufa e frescor cítrico do limão.",
      "Armazenamento: consumo imediato; manter o peixe refrigerado (0–5 °C) até o corte.",
      "Aplicações: combinados especiais, rodízio premium, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Sashimi de Atum",
    indiceCoccao: "1",
    pesoBruto: "90g",
    pesoLiquido: "90g",
    ingredientes: [["Peixe, Atum, Fresco, Cru", "90g", "90g"]],
    modoPreparo: [
      "Cortar o atum fresco em fatia de 15 g, mantendo espessura uniforme e lâmina limpa.",
      "Dispor em prato adequado, valorizando a apresentação.",
    ],
    notas: [
      "Rendimento: 6 unidades.",
      "Textura final: lâmina firme, úmida e fresca.",
      "Armazenamento: consumo imediato; manter o peixe refrigerado (0–5 °C) até o corte.",
      "Aplicações: combinados, rodízio, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Sashimi de Polvo",
    indiceCoccao: "1",
    pesoBruto: "54g",
    pesoLiquido: "54g",
    ingredientes: [
      ["Polvo", "48g", "48g"],
      ["RASPAS DE LIMÃO SICILIANO", "3g", "3g"],
      ["AZEITE TRUFADO", "3ml", "3ml"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Sashimi de Salmão",
    indiceCoccao: "1",
    pesoBruto: "90g",
    pesoLiquido: "90g",
    ingredientes: [["FILÉ DE SALMÃO", "90g", "90g"]],
    modoPreparo: [
      "Cortar o salmão fresco em fatia de 15 g, com espessura uniforme e lâmina limpa.",
      "Dispor em prato adequado, mantendo a apresentação alinhada ao padrão Kenkyo.",
    ],
    notas: [
      "Rendimento: 6 unidades.",
      "Textura final: lâmina firme, úmida, fresca e brilhante.",
      "Armazenamento: consumo imediato; manter o peixe refrigerado (0–5 °C) até o corte.",
      "Aplicações: combinados, rodízio, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Sashimi de Salmão Selado",
    indiceCoccao: "1",
    pesoBruto: "114g",
    pesoLiquido: "114g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "90g", "90g"],
      ["MOLHO TERIYAKI", "18ml", "18ml"],
      ["MIX DE GERGELIM TORRADO", "6g", "6g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em fatia de 15 g.",
      "Selar levemente o salmão na superfície, mantendo o interior cru e macio.",
      "Dispor em prato adequado.",
      "Finalizar com molho teriyaki (3 g) e salpicar gergelim (1 g).",
    ],
    notas: [],
  },
  {
    titulo: "Sashimi de Tilápia com Limão",
    indiceCoccao: "1",
    pesoBruto: "66g",
    pesoLiquido: "66g",
    ingredientes: [
      ["Tilápia, Crua", "60g", "60g"],
      ["Limão", "6g", "6g"],
    ],
    modoPreparo: [
      "Cortar a tilápia fresca em fatia de 10 g, com corte firme e lâmina limpa.",
      "Dispor em prato adequado, mantendo apresentação elegante.",
      "Finalizar com a fatia de limão (1 g), para realçar frescor e aroma.",
    ],
    notas: [
      "Textura final: lâmina delicada, fresca, suave, com toque cítrico.",
      "Armazenamento: consumo imediato; peixe mantido sob refrigeração (0–5 °C) até o corte.",
      "Aplicações: combinados, rodízio, omakase e entradas especiais.",
    ],
  },
  {
    titulo: "Sashimi de Toro de Salmão",
    indiceCoccao: "1",
    pesoBruto: "114g",
    pesoLiquido: "114g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "90g", "90g"],
      ["AZEITE TRUFADO", "12ml", "12ml"],
      ["RASPAS DE LIMÃO SICILIANO", "12g", "12g"],
    ],
    modoPreparo: [
      "Cortar o salmão fresco em fatia de 15 g, com espessura uniforme e lâmina limpa.",
      "Dispor em prato adequado, mantendo a apresentação alinhada ao padrão Kenkyo.",
    ],
    notas: [
      "Rendimento: 6 unidades.",
      "Textura final: lâmina firme, úmida, fresca e brilhante.",
      "Armazenamento: consumo imediato; manter o peixe refrigerado (0–5 °C) até o corte.",
      "Aplicações: combinados, rodízio, omakase e pratos à la carte.",
    ],
  },
  {
    titulo: "Shake Hara",
    indiceCoccao: "0.85",
    pesoBruto: "395g",
    pesoLiquido: "335.75g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "205g", "205g"],
      ["MOLHO TERIYAKI", "75ml", "75ml"],
      ["MOLHO PONZÚ", "75ml", "75ml"],
      ["CRISPY DE BATATA DOCE", "40g", "40g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Shari Kenkyo (Arroz)",
    indiceCoccao: "0.84",
    pesoBruto: "11.8Kg",
    pesoLiquido: "10Kg",
    ingredientes: [
      ["Arroz p/ Risoto", "5Kg", "5Kg"],
      ["ÁGUA FILTRADA", "5L", "5L"],
      ["MOLHO SU KENKYO", "1.8L", "1.8L"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Shimeji",
    indiceCoccao: "1",
    pesoBruto: "5.6Kg",
    pesoLiquido: "5.6Kg",
    ingredientes: [
      ["SHIMEJI, BRANCO", "4Kg", "4Kg"],
      ["MOLHO PONZÚ", "1.5L", "1.5L"],
      ["MARGARINA COM SAL", "100g", "100g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Shiromi Pipoca (Delivery)",
    indiceCoccao: "0.77",
    pesoBruto: "259g",
    pesoLiquido: "200g",
    ingredientes: [
      ["Tilápia, Crua", "150g", "150g"],
      ["MOLHO DO EBI PIPOCA", "60g", "60g"],
      ["MASSA DE TEMPURA", "32g", "32g"],
      ["Farinha, de Trigo", "10g", "10g"],
      ["TEMPERO SHIO-KOSHO", "4g", "4g"],
    ],
    modoPreparo: [
      "Cortar a tilápia em cubos médios, uniformes, e secar bem.",
      "Temperar com shio-kosho (4 g) para realçar o sabor.",
      "Empanar em duas etapas: passar os cubos na farinha de trigo (10 g); depois mergulhar na massa de tempurá (32 g), retirando o excesso.",
      "Fritar em óleo quente (170–180 °C) até dourar e ficar crocante.",
      "Escorrer em papel absorvente para retirar excesso de óleo.",
      "Envolver os cubos de tilápia fritos no molho de ebi pipoca (60 g).",
      "Finalizar com ovas black (3 g) para contraste e sofisticação.",
    ],
    notas: [],
  },
  {
    titulo: "Shiromi Sakana",
    indiceCoccao: "1",
    pesoBruto: "260g",
    pesoLiquido: "260g",
    ingredientes: [
      ["TILÁPIA EMPANADA", "96g", "96g"],
      ["FILÉ DE SALMÃO", "80g", "80g"],
      ["Queijo Cream Cheese", "40g", "40g"],
      ["CRISPY DE COUVE", "24g", "24g"],
      ["MOLHO TERIYAKI", "20ml", "20ml"],
    ],
    modoPreparo: [
      "Abrir o salmão em lâmina de 10 g.",
      "Rechear com cream cheese (5 g) e tilápia empanada (12 g).",
      "Enrolar no formato de sushi (estilo joy enrolado).",
      "Maçaricar levemente para realçar sabor.",
      "Finalizar com teriyaki (3 ml) e crispy de couve (3 g).",
    ],
    notas: [
      "A porção da receita é para a produção de 8 unidades.",
      "Rendimento: 1 unidade.",
      "Textura final: salmão fresco envolvente, recheio cremoso, toque defumado do maçarico, crocância do crispy.",
      "Armazenamento: até no máximo 24h entre 0 e -5 c°.",
    ],
  },
  {
    titulo: "Sunomono Alacart",
    indiceCoccao: "1",
    pesoBruto: "300g",
    pesoLiquido: "300g",
    ingredientes: [["SUNOMONO KENKYO", "300g", "300g"]],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Sushi Hossomaki com Patê",
    indiceCoccao: "1",
    pesoBruto: "311g",
    pesoLiquido: "311g",
    ingredientes: [
      ["PATÊ DE SALMÃO", "90g", "90g"],
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["Alga, Nori", "6g", "6g"],
    ],
    modoPreparo: [
      "Coloque a makisu embalada sobre a bancada, com o lado plano voltado para cima.",
      "Posicione a folha de nori sobre a esteira, com o lado brilhoso virado para baixo.",
      "Espalhe o arroz uniformemente sobre ¾ da folha de nori, deixando uma borda livre na parte superior (cerca de 2 cm).",
      "Distribua o salmão em tiras no centro do arroz.",
      "Adicione o cream cheese em linha contínua ao lado do salmão.",
      "Enrole o sushi com firmeza: levante a borda inferior do nori usando a makisu, cubra o recheio e pressione levemente para compactar, continue enrolando até selar completamente.",
      "Modele o rolo aplicando leve pressão com as mãos sobre a esteira embalada, deixando o formato uniforme.",
      "Corte o rolo em 10 pedaços iguais, limpando a faca entre cada corte para manter os bordos definidos.",
    ],
    notas: ["A unidade tem 22g."],
  },
  {
    titulo: "Sushi Hossomaki de Salmão",
    indiceCoccao: "1",
    pesoBruto: "206g",
    pesoLiquido: "206g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "100g", "100g"],
      ["SHARI KENKYO (ARROZ)", "100g", "100g"],
      ["Alga, Nori", "6g", "6g"],
    ],
    modoPreparo: [
      "Preparação do salmão: corte o filé de salmão em tiras finas e compridas, adequadas para o recheio de sushi (aprox. 1 cm de espessura). Mantenha refrigerado até o momento da montagem.",
      "Montagem do hossomaki: corte a folha de nori em ¾ de seu tamanho original. Coloque-a sobre a esteira de bambu (makisu) com o lado brilhante voltado para baixo. Espalhe o arroz sobre cerca de 2/3 da folha, deixando uma borda livre na parte superior. Coloque a tira de salmão no centro do arroz.",
      "Enrolar: com auxílio da esteira, enrole o sushi firmemente, começando pela parte com arroz. Pressione levemente para formar um cilindro uniforme e compacto.",
      "Corte: corte o rolo em 10 pedaços iguais, utilizando uma faca umedecida para evitar que o arroz grude.",
    ],
    notas: [
      "Manter o salmão sob refrigeração até o momento da montagem.",
      "Armazenar sob refrigeração e consumir no mesmo dia.",
      "A unidade: 17g.",
    ],
  },
  {
    titulo: "Sushi Hossomaki Filadélfia",
    indiceCoccao: "1",
    pesoBruto: "241g",
    pesoLiquido: "241g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "100g", "100g"],
      ["FILÉ DE SALMÃO", "90g", "90g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["Alga, Nori", "6g", "6g"],
    ],
    modoPreparo: [
      "Coloque a makisu embalada sobre a bancada, com o lado plano voltado para cima.",
      "Posicione a folha de nori sobre a esteira, com o lado brilhoso virado para baixo.",
      "Espalhe o arroz uniformemente sobre ¾ da folha de nori, deixando uma borda livre na parte superior (cerca de 2 cm).",
      "Distribua o salmão em tiras no centro do arroz.",
      "Adicione o cream cheese em linha contínua ao lado do salmão.",
      "Enrole o sushi com firmeza: levante a borda inferior do nori usando a makisu, cubra o recheio e pressione levemente para compactar, continue enrolando até selar completamente.",
      "Modele o rolo aplicando leve pressão com as mãos sobre a esteira embalada, deixando o formato uniforme.",
      "Corte o rolo em 10 pedaços iguais, limpando a faca entre cada corte para manter os bordos definidos.",
    ],
    notas: [],
  },
  {
    titulo: "Sushi Low Carb Patê",
    indiceCoccao: "1",
    pesoBruto: "161g",
    pesoLiquido: "161g",
    ingredientes: [
      ["PATÊ GRELHADO", "100g", "100g"],
      ["Tilápia, Crua", "50g", "50g"],
      ["Alga, Nori", "6g", "6g"],
      ["PATÊ DE SALMÃO", "5g", "5g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Sushi Low Carb Patê com Ovas",
    indiceCoccao: "1",
    pesoBruto: "146g",
    pesoLiquido: "146g",
    ingredientes: [
      ["PATÊ GRELHADO", "100g", "100g"],
      ["FILÉ DE SALMÃO", "30g", "30g"],
      ["OVAS TOBIKO BLACK", "10g", "10g"],
      ["Alga, Nori", "6g", "6g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Sushi Low Carb Peixe com Cebolinha",
    indiceCoccao: "1",
    pesoBruto: "115g",
    pesoLiquido: "115g",
    ingredientes: [
      ["Tilápia, Crua", "50g", "50g"],
      ["Cebolinha, Crua", "5g", "5g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Sushi Uramaki de Morango e Cream Cheese",
    indiceCoccao: "1",
    pesoBruto: "203g",
    pesoLiquido: "203g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["Morango, Cru", "75g", "75g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["Alga, Nori", "3g", "3g"],
    ],
    modoPreparo: [
      "Coloque a makisu embalada sobre a bancada.",
      "Posicione a folha de nori com o lado brilhoso voltado para baixo sobre a esteira.",
      "Espalhe o arroz uniformemente sobre toda a nori, pressionando levemente para fixar.",
      "Aplique o moedor de gergelim sobre toda a superfície do arroz, distribuindo de maneira homogênea.",
      "Vire a folha cuidadosamente, deixando o arroz com gergelim voltado para baixo e a nori voltada para cima.",
      "Monte o recheio: aplique uma faixa contínua de cream cheese no centro da nori, ao longo de todo o comprimento; disponha morangos inteiros sobre o cream cheese, lado a lado, até completar o rolo.",
      "Enrole o uramaki utilizando a makisu embalada: levante a borda inferior da esteira, cobrindo o recheio, pressione levemente para compactar, continue enrolando até o fechamento total.",
      "Modele o rolo aplicando leve pressão com a makisu para manter o formato firme e uniforme.",
      "Corte o rolo em 9 pedaços iguais, limpando a faca entre os cortes para manter as bordas limpas.",
    ],
    notas: ["A unidade possui 22g."],
  },
  {
    titulo: "Sushi Uramaki Ebi-Ten",
    indiceCoccao: "1",
    pesoBruto: "283g",
    pesoLiquido: "283g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["CAMARÃO EMPANADO 36/40", "70g", "70g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["CRISPY DE ALHO PORÓ", "30g", "30g"],
      ["MOLHO SWEET CHILLI", "12g", "12g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Posicionar a alga nori sobre a esteira e espalhar o shari uniformemente.",
      "Virar o arroz para baixo (uramaki) e dispor o cream cheese e o camarão empanado no centro.",
      "Enrolar firmemente o sushi, garantindo fechamento uniforme e formato cilíndrico.",
      "Dispor por cima o filé de salmão laminado.",
      "Cortar em 9 unidades iguais.",
      "Finalizar com molho sweet chili, polvilhar o mix de gergelim e cobrir com alho-poró crispy.",
    ],
    notas: [],
  },
  {
    titulo: "Sushi Uramaki Filadélfia",
    indiceCoccao: "1",
    pesoBruto: "226g",
    pesoLiquido: "226g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "90g", "90g"],
      ["SHARI KENKYO (ARROZ)", "90g", "90g"],
      ["Queijo Cream Cheese", "40g", "40g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Forre a esteira de sushi (makisu) para iniciar o preparo.",
      "Coloque a folha de alga Nori sobre a esteira, com o lado brilhoso voltado para baixo.",
      "Espalhe o arroz (Shari Kenkyo) uniformemente sobre toda a superfície da alga, pressionando levemente com as mãos úmidas para não grudar.",
      "Utilize o moedor de gergelim para triturar o mix de gergelim torrado e polvilhe de maneira uniforme sobre o arroz.",
      "Vire a alga Nori, deixando o arroz com o gergelim voltado para baixo e a parte lisa da alga voltada para cima.",
      "Monte o recheio: coloque no centro da alga uma tira de filé de salmão e, ao lado, uma camada de cream cheese (use espátula ou saco de confeiteiro).",
      "Enrole o sushi diretamente na esteira, pressionando de forma leve e contínua até que fique bem fechado.",
      "Corte o rolo em 9 pedaços iguais, limpando a faca com um pano úmido entre os cortes para obter fatias limpas.",
    ],
    notas: ["A unidade tem 24g."],
  },
  {
    titulo: "Sushi Uramaki Salmão",
    indiceCoccao: "1",
    pesoBruto: "236g",
    pesoLiquido: "236g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "130g", "130g"],
      ["SHARI KENKYO (ARROZ)", "90g", "90g"],
      ["OVAS TOBIKO BLACK", "10g", "10g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Forre a esteira de sushi (makisu) para iniciar o preparo.",
      "Coloque a folha de alga Nori sobre a esteira, com o lado brilhoso voltado para baixo.",
      "Espalhe o arroz (Shari Kenkyo) uniformemente sobre toda a superfície da alga, pressionando levemente com as mãos úmidas para não grudar.",
      "Utilize o moedor de gergelim para triturar o mix de gergelim torrado e polvilhe de maneira uniforme sobre o arroz.",
      "Vire a alga Nori, deixando o arroz com o gergelim voltado para baixo e a parte lisa da alga voltada para cima.",
      "Monte o recheio: coloque no centro da alga uma tira de filé de salmão e, ao lado, uma camada de cream cheese (use espátula ou saco de confeiteiro).",
      "Enrole o sushi diretamente na esteira, pressionando de forma leve e contínua até que fique bem fechado.",
      "Corte o rolo em 9 pedaços iguais, limpando a faca com um pano úmido entre os cortes para obter fatias limpas.",
    ],
    notas: ["A unidade tem 24g."],
  },
  {
    titulo: "Sushi Uramaki Shimeji",
    indiceCoccao: "1",
    pesoBruto: "243g",
    pesoLiquido: "243g",
    ingredientes: [
      ["SHIMEJI PREPARADO", "100g", "100g"],
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["MOLHO TERIYAKI", "12ml", "12ml"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Posicionar a alga nori sobre a esteira e espalhar o shari uniformemente sobre ela.",
      "Virar o arroz para baixo (uramaki) e dispor no centro o shimeji refogado e o cream cheese.",
      "Enrolar firmemente, garantindo formato cilíndrico e fechamento uniforme.",
      "Cortar o rolo em 9 unidades iguais.",
      "Finalizar com shimeji picado, molho teriyaki e polvilhar o mix de gergelim.",
    ],
    notas: [],
  },
  {
    titulo: "Sushi Uramaki Shiromi Croc",
    indiceCoccao: "1",
    pesoBruto: "261g",
    pesoLiquido: "261g",
    ingredientes: [
      ["TILÁPIA EMPANADA", "110g", "110g"],
      ["SHARI KENKYO (ARROZ)", "90g", "90g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["MOLHO DO EBI PIPOCA", "10g", "10g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Posicionar a alga nori sobre a esteira e espalhar o shari uniformemente sobre ela.",
      "Virar o arroz para baixo (uramaki) e dispor no centro o cream cheese e a tilápia empanada.",
      "Enrolar firmemente, garantindo formato cilíndrico e fechamento uniforme.",
      "Dispor o filé de salmão laminado sobre o rolo e maçaricar levemente.",
      "Cortar em 9 unidades iguais.",
      "Finalizar com o mix de gergelim para brilho e textura.",
    ],
    notas: [],
  },
  {
    titulo: "Sushi Uramaki Skin Dragon",
    indiceCoccao: "1",
    pesoBruto: "228g",
    pesoLiquido: "228g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["PELE DE SALMÃO FRITA (SKIN)", "45g", "45g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["MOLHO TERIYAKI", "12ml", "12ml"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Posicionar a alga nori sobre a esteira e espalhar o shari uniformemente sobre ela.",
      "Virar o arroz para baixo (uramaki) e dispor no centro o cream cheese e o skin grelhado.",
      "Enrolar firmemente, garantindo formato cilíndrico e fechamento uniforme.",
      "Dispor por cima o filé de salmão laminado.",
      "Passar o maçarico para selar levemente o salmão.",
      "Finalizar com molho teriyaki e polvilhar o mix de gergelim.",
      "Cortar em 9 unidades iguais e alinhar para montagem do prato.",
    ],
    notas: [],
  },
  {
    titulo: "Sushi Uramaki Tartare",
    indiceCoccao: "1",
    pesoBruto: "284g",
    pesoLiquido: "284g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "90g", "90g"],
      ["SHARI KENKYO (ARROZ)", "80g", "80g"],
      ["PATÊ DE SALMÃO", "63g", "63g"],
      ["Queijo Cream Cheese", "45g", "45g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
    ],
    modoPreparo: [
      "Forre a esteira de sushi (makisu) para iniciar o preparo.",
      "Coloque a folha de alga Nori sobre a esteira, com o lado brilhoso voltado para baixo.",
      "Espalhe o arroz (Shari Kenkyo) uniformemente sobre toda a superfície da alga, pressionando levemente com as mãos úmidas para não grudar.",
      "Utilize o moedor de gergelim para triturar o mix de gergelim torrado e polvilhe de maneira uniforme sobre o arroz.",
      "Vire a alga Nori, deixando o arroz com o gergelim voltado para baixo e a parte lisa da alga voltada para cima.",
      "Monte o recheio: coloque no centro da alga uma tira de filé de salmão e, ao lado, uma camada de cream cheese.",
      "Enrole o sushi diretamente na esteira, pressionando de forma leve e contínua até que fique bem fechado.",
      "Corte o rolo em 9 pedaços iguais, limpando a faca com um pano úmido entre os cortes.",
      "Finalize com patê de salmão (7 g).",
    ],
    notas: ["A unidade tem 25g."],
  },
  {
    titulo: "Temaki Filadélfia",
    indiceCoccao: "1",
    pesoBruto: "169g",
    pesoLiquido: "169g",
    ingredientes: [
      ["SHARI KENKYO (ARROZ)", "50g", "50g"],
      ["Queijo Cream Cheese", "10g", "10g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
      ["Cebolinha, Crua", "3g", "3g"],
    ],
    modoPreparo: [
      "Segurar a nori (alga) na palma da mão, com o lado áspero voltado para cima.",
      "Dispor o shari diretamente sobre a alga, ocupando cerca de um terço da folha.",
      "Adicionar o salmão fresco em cubos e o cream cheese sobre o arroz.",
      "Enrolar diretamente na mão, formando o cone com firmeza e movimento contínuo.",
      "Finalizar com o mix de gergelim e a cebolinha picada por cima.",
    ],
    notas: [],
  },
  {
    titulo: "Temaki Hot",
    indiceCoccao: "1",
    pesoBruto: "271g",
    pesoLiquido: "271g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "100g", "100g"],
      ["SHARI KENKYO (ARROZ)", "60g", "60g"],
      ["CRISPY DE ALHO PORÓ", "30g", "30g"],
      ["Queijo Cream Cheese", "20g", "20g"],
      ["MASSA DE EMPANAR", "20g", "20g"],
      ["Farinha Panko, Romariz", "20g", "20g"],
      ["MOLHO SWEET CHILLI", "12g", "12g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
      ["Alga, Nori", "3g", "3g"],
      ["Cebolinha, Crua", "3g", "3g"],
    ],
    modoPreparo: [
      "Misturar o salmão em cubos com o cream cheese.",
      "Envolver levemente essa mistura na massa de empanar e depois na farinha panko, garantindo cobertura uniforme.",
      "Fritar em óleo quente (170–180 °C) até dourar levemente.",
      "Segurar a nori na palma da mão, com o lado áspero voltado para cima.",
      "Dispor o shari sobre a alga e adicionar o salmão empanado ainda morno.",
      "Enrolar diretamente na mão, formando o cone com firmeza e movimento contínuo.",
      "Finalizar com molho sweet chili, alho-poró crispy, mix de gergelim e cebolinha picada.",
    ],
    notas: [],
  },
  {
    titulo: "Temaki Salmão",
    indiceCoccao: "1",
    pesoBruto: "159g",
    pesoLiquido: "159g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "100g", "100g"],
      ["SHARI KENKYO (ARROZ)", "50g", "50g"],
      ["Alga, Nori", "3g", "3g"],
      ["MIX DE GERGELIM TORRADO", "3g", "3g"],
      ["Cebolinha, Crua", "3g", "3g"],
    ],
    modoPreparo: [
      "Segurar a nori (alga) na palma da mão, com o lado áspero voltado para cima.",
      "Dispor o shari diretamente sobre a alga, ocupando aproximadamente um terço da folha.",
      "Adicionar o salmão fresco em cubos sobre o arroz.",
      "Enrolar diretamente na mão, formando o cone com firmeza e movimento contínuo.",
      "Finalizar com o mix de gergelim e a cebolinha picada por cima.",
    ],
    notas: [],
  },
  {
    titulo: "Usuzukuri",
    indiceCoccao: "1",
    pesoBruto: "260g",
    pesoLiquido: "260g",
    ingredientes: [
      ["Tilápia, Crua", "200g", "200g"],
      ["MOLHO CÍTRICO KENKYO", "50ml", "50ml"],
      ["AZEITE TRUFADO", "10ml", "10ml"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Usuzukuri de Polvo",
    indiceCoccao: "1",
    pesoBruto: "108g",
    pesoLiquido: "108g",
    ingredientes: [
      ["Polvo", "84g", "84g"],
      ["OVAS TOBIKO BLACK", "12g", "12g"],
      ["RASPAS DE LIMÃO SICILIANO", "6g", "6g"],
      ["AZEITE TRUFADO", "6ml", "6ml"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Usuzukuri de Salmão",
    indiceCoccao: "0.78",
    pesoBruto: "260g",
    pesoLiquido: "202.8g",
    ingredientes: [
      ["FILÉ DE SALMÃO", "190g", "190g"],
      ["MOLHO CÍTRICO KENKYO", "50ml", "50ml"],
      ["AZEITE TRUFADO", "10ml", "10ml"],
      ["RASPAS DE LIMÃO SICILIANO", "10g", "10g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Yakisoba de Carne",
    indiceCoccao: "0.88",
    pesoBruto: "452.5g",
    pesoLiquido: "398.2g",
    ingredientes: [
      ["MIX DE LEGUMES", "180g", "180g"],
      ["MOLHO DE YAKISSOBA", "100ml", "100ml"],
      ["PORÇÃO CARNE YAKISSOBA", "100g", "100g"],
      ["Macarrão para Yakissoba", "62.5g", "62.5g"],
      ["Milho, Amido, Cru", "10g", "10g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Yakisoba de Frango",
    indiceCoccao: "0.88",
    pesoBruto: "452.5g",
    pesoLiquido: "398.2g",
    ingredientes: [
      ["MIX DE LEGUMES", "180g", "180g"],
      ["MOLHO DE YAKISSOBA", "100ml", "100ml"],
      ["PORÇÃO DE FRANGO YAKISSOBA", "100g", "100g"],
      ["Macarrão para Yakissoba", "62.5g", "62.5g"],
      ["Milho, Amido, Cru", "10g", "10g"],
    ],
    modoPreparo: [],
    notas: [],
  },
  {
    titulo: "Yakisoba Misto",
    indiceCoccao: "0.88",
    pesoBruto: "452.5g",
    pesoLiquido: "400g",
    ingredientes: [
      ["MIX DE LEGUMES", "180g", "180g"],
      ["PORÇÃO MISTA YAKISSOBA", "100g", "100g"],
      ["MOLHO DE YAKISSOBA", "100ml", "100ml"],
      ["Macarrão para Yakissoba", "62.5g", "62.5g"],
      ["Milho, Amido, Cru", "10g", "10g"],
    ],
    modoPreparo: [],
    notas: [],
  },
];

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
    (await db.select({ title: documents.title }).from(documents)).map((d) => d.title),
  );

  for (const receita of RECEITAS) {
    if (existingTitles.has(receita.titulo)) {
      console.log(`"${receita.titulo}" já existe, pulando.`);
      continue;
    }
    const html = renderReceitaHtml(receita);
    const blob = await put(
      `documentos/ficha-tecnica-${receita.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.html`,
      html,
      { access: "public", contentType: "text/html" },
    );
    await db.insert(documents).values({
      title: receita.titulo,
      category: "ficha_tecnica",
      fileUrl: blob.url,
      createdBy: gestor.id,
    });
    console.log(`"${receita.titulo}" importado.`);
  }
  console.log("Importação de Fichas Técnicas concluída.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
