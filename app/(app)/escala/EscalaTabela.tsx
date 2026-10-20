import { Fragment } from "react";
import { diaDaSemana } from "@/lib/escala";

const DIA = ["D", "S", "T", "Q", "Q", "S", "S"];

export type TabelaGrupo = {
  titulo: string | null;
  pessoas: { key: string | number; nome: string; funcao: string | null; folgas: Set<string>; aContratar?: boolean }[];
};

/** Grade de folgas do mês: pessoas nas linhas, dias nas colunas, F = folga. */
export function EscalaTabela({
  mes,
  grupos,
  hoje,
  fechados = [],
}: {
  mes: string;
  grupos: TabelaGrupo[];
  hoje: string;
  fechados?: string[];
}) {
  const [y, m] = mes.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dias = Array.from({ length: total }, (_, i) => {
    const date = `${mes}-${String(i + 1).padStart(2, "0")}`;
    return { date, dow: diaDaSemana(date) };
  });
  const sticky = { position: "sticky", left: 0, background: "var(--bg, #fff)" } as const;

  return (
    <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "4px 12px 4px 0", ...sticky }}>Pessoa</th>
          {dias.map((d) => (
            <th
              key={d.date}
              style={{
                padding: "2px 4px",
                textAlign: "center",
                minWidth: 26,
                color: d.date === hoje ? "var(--kenkyo-red)" : fechados.includes(d.date) ? "var(--text-muted, #888)" : undefined,
                borderBottom: d.date === hoje ? "2px solid var(--kenkyo-red)" : undefined,
              }}
              title={fechados.includes(d.date) ? "Casa fechada" : undefined}
            >
              <div style={{ fontWeight: 400, fontSize: 11 }}>{DIA[d.dow]}</div>
              <div>{Number(d.date.slice(8))}</div>
            </th>
          ))}
          <th style={{ padding: "2px 8px", textAlign: "center" }}>Folgas</th>
        </tr>
      </thead>
      <tbody>
        {grupos.map((g, gi) => (
          <Fragment key={gi}>
            {g.titulo && (
              <tr>
                <td colSpan={total + 2} style={{ padding: "14px 0 4px", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted, #888)", fontWeight: 600 }}>
                  {g.titulo}
                </td>
              </tr>
            )}
            {g.pessoas.map((p) => (
              <tr key={`${gi}-${p.key}`} style={{ borderTop: "1px solid var(--border, #e5e5e5)" }}>
                <td style={{ padding: "6px 12px 6px 0", whiteSpace: "nowrap", ...sticky }}>
                  <strong style={p.aContratar ? { color: "var(--danger-text, #b42318)" } : undefined}>{p.nome}</strong>
                  {p.funcao && <div className="items-count">{p.funcao}</div>}
                </td>
                {dias.map((d) => (
                  <td key={d.date} style={{ textAlign: "center", padding: 2, background: fechados.includes(d.date) ? "var(--bg-muted, rgba(0,0,0,.05))" : undefined }}>
                    {p.folgas.has(d.date) ? <span className="badge badge-warning" style={{ padding: "2px 5px" }}>F</span> : null}
                  </td>
                ))}
                <td style={{ textAlign: "center", padding: "0 8px" }}>{p.folgas.size}</td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
