// Sem "server-only": a tela monta o endereço do PDF com este mesmo nome.

const TIPO = { interna: "interna", externa: "externa" } as const;

function slug(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Nome do PDF da requisição: tipo, unidade e a data em que foi feita
 * (ex.: requisicao-externa-kenkyo-garden-24-10-2026.pdf). O dia vem pronto
 * (YYYY-MM-DD, no horário de Brasília), para o servidor e a tela chegarem
 * ao mesmo nome. O aparelho usa esse nome ao salvar, imprimir ou compartilhar.
 */
export function nomeArquivoRequisicao(r: { tipo: string; unitName: string; dia: string }) {
  const [y, m, d] = r.dia.split("-");
  const tipo = TIPO[r.tipo as keyof typeof TIPO] ?? "";
  return `requisicao${tipo ? `-${tipo}` : ""}-${slug(r.unitName)}-${d}-${m}-${y}.pdf`;
}
