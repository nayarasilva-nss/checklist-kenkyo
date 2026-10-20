export type TipoExcecao = "folga" | "trabalho";

/** Dia da semana (0=domingo..6=sábado) de uma data "YYYY-MM-DD". */
export function diaDaSemana(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * A pessoa está de folga nesse dia? Antes da vigência da escala (ou sem
 * escala) ninguém folga. Uma exceção do dia vale mais que a folga fixa.
 */
export function estaDeFolga(
  folgaDias: number[],
  date: string,
  vigenteDesde: string | null,
  excecao?: TipoExcecao,
): boolean {
  if (!vigenteDesde || date < vigenteDesde) return false;
  if (excecao) return excecao === "folga";
  return folgaDias.includes(diaDaSemana(date));
}
