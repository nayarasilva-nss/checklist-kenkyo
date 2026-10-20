export type TipoExcecao = "folga" | "trabalho";

/** Dia da semana (0=domingo..6=sábado) de uma data "YYYY-MM-DD". */
export function diaDaSemana(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Folga de todos antes de a escala por pessoa começar: domingo. */
export const FOLGA_ANTES_DA_ESCALA = [0];

/**
 * A pessoa está de folga nesse dia? Uma exceção do dia vale mais que tudo.
 * Antes da vigência da escala (ou sem escala) a folga é a de todos
 * (domingo); a partir dela, a folga fixa de cada pessoa.
 */
export function estaDeFolga(
  folgaDias: number[],
  date: string,
  vigenteDesde: string | null,
  excecao?: TipoExcecao,
): boolean {
  if (excecao) return excecao === "folga";
  const dias = !vigenteDesde || date < vigenteDesde ? FOLGA_ANTES_DA_ESCALA : folgaDias;
  return dias.includes(diaDaSemana(date));
}
