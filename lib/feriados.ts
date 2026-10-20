export type DiaEspecial = { date: string; tipo: "feriado" | "vespera"; nome: string };

function pascoa(ano: number): Date {
  // Algoritmo de Meeus/Jones/Butcher
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function somar(d: Date, dias: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + dias);
  return r;
}

/** Feriados nacionais (vermelho) e vésperas/pontos facultativos (amarelo) do ano. */
export function diasEspeciais(ano: number): Map<string, DiaEspecial> {
  const p = pascoa(ano);
  const lista: DiaEspecial[] = [
    { date: `${ano}-01-01`, tipo: "feriado", nome: "Confraternização Universal" },
    { date: iso(somar(p, -2)), tipo: "feriado", nome: "Sexta-feira Santa" },
    { date: `${ano}-04-21`, tipo: "feriado", nome: "Tiradentes" },
    { date: `${ano}-05-01`, tipo: "feriado", nome: "Dia do Trabalho" },
    { date: `${ano}-09-07`, tipo: "feriado", nome: "Independência" },
    { date: `${ano}-10-12`, tipo: "feriado", nome: "N. Sra. Aparecida" },
    { date: `${ano}-11-02`, tipo: "feriado", nome: "Finados" },
    { date: `${ano}-11-15`, tipo: "feriado", nome: "Proclamação da República" },
    { date: `${ano}-11-20`, tipo: "feriado", nome: "Consciência Negra" },
    { date: `${ano}-12-25`, tipo: "feriado", nome: "Natal" },
    { date: iso(somar(p, -48)), tipo: "vespera", nome: "Carnaval" },
    { date: iso(somar(p, -47)), tipo: "vespera", nome: "Carnaval" },
    { date: iso(somar(p, 60)), tipo: "vespera", nome: "Corpus Christi" },
    { date: `${ano}-12-24`, tipo: "vespera", nome: "Véspera de Natal" },
    { date: `${ano}-12-31`, tipo: "vespera", nome: "Véspera de Ano-Novo" },
  ];
  return new Map(lista.map((d) => [d.date, d]));
}
