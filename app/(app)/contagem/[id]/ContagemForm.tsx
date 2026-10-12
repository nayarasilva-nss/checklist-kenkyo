"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { salvarContagem } from "@/lib/actions/contagens";
import type { ContagemDetalhe } from "@/lib/erp/contagens";

// quantidade como o ERP manda ("1.5000") → como a pessoa lê ("1,5")
const paraTela = (q: string | null) => (q === null ? "" : String(Number(q)).replace(".", ","));
const valido = (t: string) => t === "" || /^\d+([.,]\d+)?$/.test(t.trim());

/**
 * A folha de contagem no celular. Às cegas: só o que contar, nunca o saldo.
 * O líder vê os itens do setor dele (item sem setor aparece para todos);
 * gerente e gestor veem tudo e entregam para conferência no ERP.
 */
export function ContagemForm({ unidadeId, contagem, setor, podeEntregar, voltar }: {
  unidadeId: number; contagem: ContagemDetalhe; setor: string | null; podeEntregar: boolean; voltar: string;
}) {
  const router = useRouter();
  const inicial = useMemo(() => Object.fromEntries(contagem.itens.map((i) => [i.linha_id, paraTela(i.qtd_contada)])), [contagem]);
  const [valores, setValores] = useState<Record<number, string>>(inicial);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>(setor ? "meu" : "todos");
  const [msg, setMsg] = useState<{ erro?: string; ok?: string } | null>(null);
  const [gravando, iniciar] = useTransition();
  const aberta = contagem.status === "aberta";

  const doSetor = (s: string[]) => !setor || s.length === 0 || s.includes(setor);
  const setores = [...new Set(contagem.itens.flatMap((i) => i.setores))].sort();
  const termo = busca.trim().toLowerCase();
  const visiveis = contagem.itens.filter((i) =>
    (filtro === "todos" ? true : filtro === "meu" ? doSetor(i.setores) : filtro === "faltam" ? valores[i.linha_id] === "" : i.setores.includes(filtro))
    && (!termo || i.nome.toLowerCase().includes(termo) || i.codigo.toLowerCase().includes(termo)));
  const mudadas = contagem.itens.filter((i) => valores[i.linha_id] !== inicial[i.linha_id]);
  const contados = contagem.itens.filter((i) => valores[i.linha_id] !== "").length;
  const invalidos = mudadas.filter((i) => !valido(valores[i.linha_id]!));
  const grupos = new Map<string, typeof visiveis>();
  for (const i of visiveis) grupos.set(i.categoria, [...(grupos.get(i.categoria) ?? []), i]);

  function gravar(entregar: boolean) {
    if (invalidos.length) { setMsg({ erro: `Quantidade inválida em ${invalidos[0]!.nome}. Use números, como 2 ou 1,5.` }); return; }
    iniciar(async () => {
      const r = await salvarContagem(unidadeId, contagem.id, mudadas.map((i) => ({ linha_id: i.linha_id, qtd: valores[i.linha_id]! || null })), entregar);
      setMsg(r.error ? { erro: r.error } : { ok: r.ok });
      if (!r.error) router.refresh();
    });
  }

  function zerarFaltantes() {
    const faltam = visiveis.filter((i) => valores[i.linha_id] === "");
    if (!faltam.length) return;
    if (!confirm(`Marcar ${faltam.length} ${faltam.length === 1 ? "item" : "itens"} sem contagem como 0 (não tem nenhum no local)?`)) return;
    setValores((v) => ({ ...v, ...Object.fromEntries(faltam.map((i) => [i.linha_id, "0"])) }));
  }

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>{contagem.local}</h2>
        <Link href={voltar} className="btn-link">voltar</Link>
      </div>
      <p className="items-count" style={{ marginTop: 0 }}>
        {contados} de {contagem.itens.length} itens contados
        {!aberta && " · entregue: o gerente confere e fecha no ERP"}
      </p>

      {aberta && (
        <>
          <div className="filter-pills">
            {setor && <button type="button" className={`pill${filtro === "meu" ? " active" : ""}`} onClick={() => setFiltro("meu")}>{setor}</button>}
            <button type="button" className={`pill${filtro === "todos" ? " active" : ""}`} onClick={() => setFiltro("todos")}>Todos</button>
            <button type="button" className={`pill${filtro === "faltam" ? " active" : ""}`} onClick={() => setFiltro("faltam")}>Faltam</button>
            {!setor && setores.map((s) => <button key={s} type="button" className={`pill${filtro === s ? " active" : ""}`} onClick={() => setFiltro(s)}>{s}</button>)}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Procurar item" aria-label="Procurar item" />
          </div>
        </>
      )}

      {visiveis.length === 0 && <div className="empty-state">Nenhum item neste filtro.</div>}
      {[...grupos.entries()].map(([categoria, itens]) => (
        <div key={categoria} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, margin: "12px 0 6px" }}>{categoria}</h3>
          {itens.map((i) => {
            const v = valores[i.linha_id] ?? "";
            return (
              <div key={i.linha_id} className="list-item" style={{ alignItems: "center" }}>
                <div className="info" style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0 }}>{i.nome}</h4>
                  <p style={{ margin: 0 }}>
                    {i.dono ? `de ${i.dono} · ` : ""}{i.unidade_uso}
                    {i.contado_por && v === inicial[i.linha_id] && v !== "" ? ` · contado por ${i.contado_por}` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "none" }}>
                  <input
                    value={v}
                    onChange={(e) => setValores((s) => ({ ...s, [i.linha_id]: e.target.value }))}
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={!aberta}
                    aria-label={`Quantidade de ${i.nome} em ${i.unidade_uso}`}
                    placeholder="—"
                    style={{ width: 84, textAlign: "right", fontSize: 18, padding: "8px 10px", borderRadius: 8,
                      border: `1px solid ${valido(v) ? "#c9c9cd" : "#c9252b"}`, background: v === "" ? "#fff" : "#f1f8f3" }}
                  />
                  {aberta && v === "" && <button type="button" className="btn-small" onClick={() => setValores((s) => ({ ...s, [i.linha_id]: "0" }))}>0</button>}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {aberta && <div className="contagem-espaco" aria-hidden="true" />}
      {aberta && (
        <div className="contagem-rodape">
          <button type="button" className="btn-save" disabled={gravando || mudadas.length === 0} onClick={() => gravar(false)}>
            {gravando ? "Salvando…" : mudadas.length ? `Salvar (${mudadas.length})` : "Salvo"}
          </button>
          <button type="button" className="btn-small" disabled={gravando} onClick={zerarFaltantes}>Os que faltam aqui são 0</button>
          {podeEntregar && (
            <button type="button" className="btn-primary" disabled={gravando || contados < contagem.itens.length} onClick={() => gravar(true)}
              title={contados < contagem.itens.length ? "Conte todos os itens antes de entregar" : undefined}>
              Entregar para conferência
            </button>
          )}
          {msg?.erro && <span className="login-error">{msg.erro}</span>}
          {msg?.ok && <span className="items-count">{msg.ok}</span>}
        </div>
      )}
    </>
  );
}
