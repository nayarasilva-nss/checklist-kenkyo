// Sem "server-only": a tela de ligação usa no navegador para sugerir o fator
// quando o gestor escolhe um item.

// setores: os setores do ERP que pedem o item (vazio = todos).
export type ItemErp = { codigo: string; nome: string; unidade_uso: string; categoria: string; tipo: string; setores?: string[] };

// ---------------------------------------------------------------------------
// Sugestão de ligação pelo nome
// ---------------------------------------------------------------------------

const PALAVRAS_VAZIAS = new Set([
  "DE", "DA", "DO", "DAS", "DOS", "E", "C", "COM", "P", "PARA", "EM", "A", "O",
  // medida e embalagem não dizem que mercadoria é
  "ML", "KG", "KGS", "GR", "LT", "LTS", "UN", "UND", "UNID", "UNIDADE", "UNICO", "CX", "PCT", "PACOTE",
]);

function palavras(texto: string): string[] {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .split(" ")
    .filter((p) => p.length > 1 && !PALAVRAS_VAZIAS.has(p) && !/^\d+$/.test(p));
}

/**
 * O item do ERP mais parecido pelo nome — só quando todas as palavras do
 * nome daqui aparecem no do ERP. Errar a ligação estraga o estoque: na
 * dúvida, não sugere.
 */
export function sugerirItemErp(nome: string, itens: ItemErp[]): ItemErp | null {
  const alvo = new Set(palavras(nome));
  if (alvo.size === 0) return null;
  let melhor: { item: ItemErp; nota: number } | null = null;
  for (const item of itens) {
    const deles = new Set(palavras(item.nome));
    if (deles.size === 0) continue;
    const comuns = [...alvo].filter((p) => deles.has(p)).length;
    const cobre = comuns / alvo.size;
    // todas as palavras: Sauvignon Blanc não é Cabernet Sauvignon
    if (cobre < 1) continue;
    // empate: o nome do ERP com menos palavras sobrando
    const nota = cobre + comuns / deles.size;
    if (!melhor || nota > melhor.nota) melhor = { item, nota };
  }
  return melhor?.item ?? null;
}

/** Quanto da unidade de uso do ERP vem em 1 unidade do checklist, quando dá para saber pela medida. */
export function sugerirFator(medidaChecklist: string, unidadeErp: string): number | null {
  const erp = unidadeErp.toUpperCase();
  const tabela: Record<string, Record<string, number>> = {
    kg: { KG: 1, GRAMA: 1000, G: 1000 },
    g: { KG: 0.001, GRAMA: 1, G: 1 },
    L: { L: 1, ML: 1000 },
    ml: { L: 0.001, ML: 1 },
    un: { UN: 1 },
    cx: { CX: 1 },
    pct: { PACOTE: 1, PCT: 1 },
  };
  return tabela[medidaChecklist]?.[erp] ?? null;
}
