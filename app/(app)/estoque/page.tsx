import Link from "next/link";
import { redirect } from "next/navigation";
import { canVerEstoque } from "@/lib/auth/estoque";
import { getCurrentUser } from "@/lib/auth/dal";
import { unidadeDaContagem } from "@/lib/data/contagem";
import { estoqueNoErp, type EstoqueDaUnidade } from "@/lib/erp/estoque";
import { erpConfigurado } from "@/lib/erp/integracao";

const SITUACAO = {
  sem_estoque: { rotulo: "Sem estoque", classe: "bad" },
  abaixo_minimo: { rotulo: "Abaixo do mínimo", classe: "warn" },
  ponto_pedido: { rotulo: "No ponto de pedido", classe: "info" },
} as const;

const brl = (v: number | null) => (v === null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Estoque da unidade, só leitura, lido do ERP: o saldo de cada item por local,
 * com custo, e os alertas (sem estoque, abaixo do mínimo, no ponto de pedido,
 * lotes perto de vencer). Não altera nada, e é separado da contagem, que é às cegas.
 */
export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string; aba?: string; q?: string; categoria?: string; curva?: string }>;
}) {
  const user = await getCurrentUser();
  if (!canVerEstoque(user)) redirect("/hoje");
  const { unidade: escolhida, aba: rawAba, q = "", categoria = "", curva = "" } = await searchParams;
  const aba = rawAba === "alertas" ? "alertas" : "saldo";
  const { lista, unidade } = await unidadeDaContagem(user, Number(escolhida) || null);

  let dados: EstoqueDaUnidade | null = null;
  let erro: string | null = null;
  if (!erpConfigurado()) erro = "A ligação com o ERP não está configurada.";
  else if (unidade) {
    try {
      dados = await estoqueNoErp(unidade.cnpj);
    } catch (e) {
      erro = e instanceof Error ? e.message : "Não foi possível falar com o ERP.";
    }
  }

  const base = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (unidade && lista.length > 1) p.set("unidade", String(unidade.id));
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    const s = p.toString();
    return `/estoque${s ? `?${s}` : ""}`;
  };

  const nAlertas = dados ? dados.alertas.length + dados.vencendo.length : 0;
  const categorias = dados ? [...new Set(dados.itens.map((i) => i.categoria).filter((c): c is string => !!c))].sort() : [];
  const itens = (dados?.itens ?? []).filter(
    (i) =>
      (!q || semAcento(`${i.nome} ${i.codigo}`).includes(semAcento(q))) &&
      (!categoria || i.categoria === categoria) &&
      (!curva || i.curva === curva),
  );
  const valorTotal = itens.reduce((s, i) => s + (i.valor ?? 0), 0);

  return (
    <>
      <div className="page-topbar"><h2 style={{ marginBottom: 0 }}>Estoque{unidade ? ` · ${unidade.name}` : ""}</h2></div>
      {lista.length > 1 && (
        <div className="filter-pills">
          {lista.map((u) => <Link key={u.id} href={`/estoque?unidade=${u.id}${aba === "alertas" ? "&aba=alertas" : ""}`} className={`pill${u.id === unidade?.id ? " active" : ""}`}>{u.name}</Link>)}
        </div>
      )}
      {!unidade ? (
        <div className="empty-state">Sua unidade ainda não está ligada ao ERP. Quem administra liga em Gerenciar › ERP.</div>
      ) : erro || !dados ? (
        <div className="empty-state">{erro}</div>
      ) : (
        <>
          <div className="filter-pills">
            <Link href={base({})} className={`pill${aba === "saldo" ? " active" : ""}`}>Saldo atual</Link>
            <Link href={base({ aba: "alertas" })} className={`pill${aba === "alertas" ? " active" : ""}`}>Alertas{nAlertas > 0 ? ` · ${nAlertas}` : ""}</Link>
          </div>

          {aba === "saldo" ? (
            <>
              <form className="req-filters" action="/estoque" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", margin: "12px 0" }}>
                {unidade && lista.length > 1 && <input type="hidden" name="unidade" value={unidade.id} />}
                <div className="req-filter-field"><label htmlFor="estq">Buscar</label><input id="estq" name="q" defaultValue={q} placeholder="Nome ou código" /></div>
                <div className="req-filter-field">
                  <label htmlFor="estcat">Categoria</label>
                  <select id="estcat" name="categoria" defaultValue={categoria}><option value="">Todas</option>{categorias.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="req-filter-field">
                  <label htmlFor="estcurva">Curva</label>
                  <select id="estcurva" name="curva" defaultValue={curva}><option value="">Todas</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select>
                </div>
                <button className="btn-small" type="submit">Filtrar</button>
                {(q || categoria || curva) && <Link className="btn-tertiary" href={base({})}>Limpar</Link>}
              </form>
              <p className="items-count">{itens.length} {itens.length === 1 ? "item" : "itens"} com saldo · valor em estoque {brl(valorTotal)}</p>
              {itens.length === 0 ? (
                <div className="empty-state">{dados.itens.length === 0 ? "Esta unidade ainda não tem saldo lançado no ERP." : "Nenhum item com esses filtros."}</div>
              ) : (
                <div className="today-card" style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
                    <thead>
                      <tr style={{ textAlign: "left" }}>
                        <th style={{ padding: "6px 8px" }}>Item</th><th style={{ padding: "6px 8px" }}>Categoria</th><th style={{ padding: "6px 8px" }}>Curva</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>Saldo</th><th style={{ padding: "6px 8px", textAlign: "right" }}>Custo médio</th><th style={{ padding: "6px 8px", textAlign: "right" }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((i) => (
                        <tr key={i.codigo} style={{ borderTop: "1px solid var(--border, #e5e5e5)", verticalAlign: "top" }}>
                          <td style={{ padding: "8px" }}>
                            <strong>{i.nome}</strong>
                            {i.locais.length > 1 && <div className="items-count">{i.locais.map((l) => `${l.local}: ${num(l.quantidade)}`).join(" · ")}</div>}
                          </td>
                          <td style={{ padding: "8px" }}>{i.categoria ?? "—"}</td>
                          <td style={{ padding: "8px" }}>{i.curva}</td>
                          <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap" }}>{num(i.quantidade)} {i.unidade_uso}</td>
                          <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap" }}>{brl(i.custo_medio)}</td>
                          <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap" }}>{brl(i.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : nAlertas === 0 ? (
            <div className="empty-state">Nenhum alerta: nada sem estoque, abaixo do mínimo ou perto de vencer.</div>
          ) : (
            <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
              {(["sem_estoque", "abaixo_minimo", "ponto_pedido"] as const).map((s) => {
                const doTipo = dados.alertas.filter((a) => a.situacao === s);
                if (doTipo.length === 0) return null;
                return (
                  <div key={s} className={`tone-card ${SITUACAO[s].classe}`}>
                    <div className="tone-label">{SITUACAO[s].rotulo} · {doTipo.length}</div>
                    {doTipo.map((a, i) => (
                      <div key={`${a.codigo}-${a.local}`} style={{ padding: "8px 0", borderTop: i ? "1px solid color-mix(in srgb, var(--tone) 20%, transparent)" : "none", fontSize: 14 }}>
                        <strong>{a.item}</strong>
                        <div className="tone-meta" style={{ marginTop: 2 }}>
                          {a.local} · tem {num(a.quantidade)} {a.unidade_uso} · mínimo {num(a.estoque_min)}{a.ponto_pedido !== null ? ` · pedir a partir de ${num(a.ponto_pedido)}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {dados.vencendo.length > 0 && (
                <div className="tone-card warn">
                  <div className="tone-label">Perto de vencer · {dados.vencendo.length}</div>
                  {dados.vencendo.map((v, i) => (
                    <div key={`${v.item}-${v.lote}-${v.local}`} style={{ padding: "8px 0", borderTop: i ? "1px solid color-mix(in srgb, var(--tone) 20%, transparent)" : "none", fontSize: 14 }}>
                      <strong>{v.item}</strong>
                      <div className="tone-meta" style={{ marginTop: 2 }}>
                        lote {v.lote} · {v.local} · {num(v.quantidade)} {v.unidade_uso} · {v.dias_para_vencer < 0 ? `venceu há ${-v.dias_para_vencer} dia${v.dias_para_vencer === -1 ? "" : "s"}` : v.dias_para_vencer === 0 ? "vence hoje" : `vence em ${v.dias_para_vencer} dia${v.dias_para_vencer === 1 ? "" : "s"}`} ({v.validade.split("-").reverse().join("/")})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
