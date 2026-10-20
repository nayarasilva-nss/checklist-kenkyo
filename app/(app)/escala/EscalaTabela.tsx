import { Fragment } from "react";
import { diaDaSemana } from "@/lib/escala";
import { diasEspeciais } from "@/lib/feriados";

const DIA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export type TabelaGrupo = {
  titulo: string | null;
  pessoas: { key: string | number; nome: string; funcao: string | null; folgas: Set<string>; aContratar?: boolean }[];
};

const dd = (n: number) => String(n).padStart(2, "0");

/**
 * Grade de folgas do mês no modelo da planilha impressa: semanas de segunda
 * a domingo, fim de semana em cinza, feriado em vermelho, véspera em amarelo.
 */
export function EscalaTabela({
  mes,
  grupos,
  hoje,
  unidade,
}: {
  mes: string;
  grupos: TabelaGrupo[];
  hoje: string;
  unidade?: string | null;
}) {
  const [y, m] = mes.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const especiais = diasEspeciais(y);
  const dias = Array.from({ length: total }, (_, i) => {
    const date = `${mes}-${dd(i + 1)}`;
    const dow = diaDaSemana(date);
    const esp = especiais.get(date);
    // a semana começa na segunda-feira (ou no dia 1)
    return { n: i + 1, date, dow, ini: i === 0 || dow === 1, esp };
  });
  const semanas: { de: number; ate: number; cols: number }[] = [];
  for (const d of dias) {
    if (d.ini) semanas.push({ de: d.n, ate: d.n, cols: 1 });
    else {
      const s = semanas[semanas.length - 1];
      s.ate = d.n;
      s.cols += 1;
    }
  }
  const cls = (d: (typeof dias)[number]) =>
    d.esp ? (d.esp.tipo === "feriado" ? "feriado" : "vespera") : d.dow === 0 || d.dow === 6 ? "fds" : "";
  const doMes = [...new Set([...especiais.values()].filter((e) => e.date.startsWith(mes)).map((e) => `${e.tipo}|${e.nome}|${e.date}`))];
  const legenda = doMes.map((x) => x.split("|"));

  // número corrido das pessoas, atravessando os grupos
  const inicioGrupo = grupos.map((_, gi) => grupos.slice(0, gi).reduce((acc, g) => acc + g.pessoas.length, 0));
  return (
    <div className="escala-wrap">
      <div className="escala-head">
        <div className="escala-title">Escala de folgas — {MESES[m - 1]} {y}</div>
        {unidade && <div className="escala-unit">Setor/Unidade: <strong>{unidade}</strong></div>}
      </div>
      <table className="escala-grid">
        <thead>
          <tr>
            <th className="semana" />
            {semanas.map((s, i) => (
              <th key={i} className="semana" colSpan={s.cols}>
                Semana {i + 1} ({dd(s.de)}–{dd(s.ate)})
              </th>
            ))}
            <th className="semana" />
          </tr>
          <tr>
            <th className="nome">FUNCIONÁRIO</th>
            {dias.map((d) => (
              <th
                key={d.date}
                className={`dia ${cls(d)}${d.ini ? " ini-semana" : ""}${d.date === hoje ? " hoje" : ""}`}
                title={d.esp?.nome}
              >
                <small>{DIA[d.dow]}</small>
                <b>{d.n}</b>
              </th>
            ))}
            <th className="total">TOTAL<br />FOLGAS</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g, gi) => (
            <Fragment key={gi}>
              {g.titulo && (
                <tr className="titulo-grupo">
                  <td colSpan={total + 2}>{g.titulo}</td>
                </tr>
              )}
              {g.pessoas.map((p, pi) => {
                const numero = inicioGrupo[gi] + pi + 1;
                return (
                  <tr key={`${gi}-${p.key}`} className={(pi + 1) % 5 === 0 ? "sep-grupo" : undefined}>
                    <td className={`pessoa${p.aContratar ? " a-contratar" : ""}`}>
                      <span className="num">{dd(numero)}</span>
                      <span className="nome-txt">{p.nome}</span>
                      {p.funcao && <span className="funcao">{p.funcao}</span>}
                    </td>
                    {dias.map((d) => (
                      <td key={d.date} className={`${cls(d)}${d.ini ? " ini-semana" : ""}${d.date === hoje ? " hoje" : ""}`}>
                        {p.folgas.has(d.date) ? <span className="folga">F</span> : null}
                      </td>
                    ))}
                    <td className="tot">{p.folgas.size}</td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
      <div className="escala-legenda">
        {legenda.map(([tipo, nome, date]) => (
          <span key={date}>
            <i style={{ background: tipo === "feriado" ? "#c62828" : "#b7860b" }} />
            {Number(date.slice(8))}/{date.slice(5, 7)} — {nome}{tipo === "feriado" ? " · feriado" : " · ponto facultativo"}
          </span>
        ))}
        <span><i style={{ background: "#475563" }} />Fim de semana</span>
        <span><span className="folga" style={{ minWidth: 18, padding: "1px 0", textAlign: "center" }}>F</span>Folga</span>
      </div>
    </div>
  );
}
