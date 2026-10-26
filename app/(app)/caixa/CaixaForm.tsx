"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enviarFechamentoCaixa } from "@/lib/actions/caixa";
import type { CaixaDoDia, FechamentoCaixa } from "@/lib/erp/caixa";

// valor como o ERP manda ("1250.40") → como a pessoa lê ("1250,40")
const paraTela = (v: string | null | undefined) => (v === null || v === undefined ? "" : Number(v).toFixed(2).replace(".", ","));
// o que a pessoa digitou ("1.250,40", "1250,4", "1250.40") → número
const ler = (t: string) => {
  const s = t.trim();
  if (!s) return 0;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s);
  return Number.isFinite(n) ? n : NaN;
};
const reais = (n: number) => (Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—");

function Campo({ rotulo, ajuda, valor, mudar, travado }: { rotulo: string; ajuda?: string; valor: string; mudar: (v: string) => void; travado: boolean }) {
  return (
    <div className="list-item" style={{ alignItems: "center" }}>
      <div className="info" style={{ minWidth: 0 }}>
        <h4 style={{ margin: 0 }}>{rotulo}</h4>
        {ajuda && <p style={{ margin: 0 }}>{ajuda}</p>}
      </div>
      <input value={valor} onChange={(e) => mudar(e.target.value)} inputMode="decimal" autoComplete="off" disabled={travado}
        aria-label={rotulo} placeholder="R$ 0,00"
        style={{ width: 130, textAlign: "right", fontSize: 18, padding: "8px 10px", borderRadius: 8, flex: "none",
          border: `1px solid ${Number.isNaN(ler(valor)) ? "#c9252b" : "#c9c9cd"}`, background: valor === "" ? "#fff" : "#f1f8f3" }} />
    </div>
  );
}

/**
 * O fechamento de um caixa num dia. Cada forma de pagamento é o total do relatório da maquininha ou do Saipos; o
 * dinheiro é contado na gaveta ANTES de tirar a sangria. A sangria vai para o cofre.
 */
export function CaixaForm({ unidadeId, data, hoje, dia }: { unidadeId: number; data: string; hoje: string; dia: CaixaDoDia }) {
  const router = useRouter();
  const [caixa, setCaixa] = useState(dia.fechamentos[0]?.caixa ?? "Caixa");
  const enviado: FechamentoCaixa | undefined = dia.fechamentos.find((f) => f.caixa.toLowerCase() === caixa.trim().toLowerCase());
  const grupos = [...new Set([...dia.grupos, ...(enviado?.valores.map((v) => v.grupo) ?? [])])];
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries((enviado?.valores ?? []).map((v) => [v.grupo, paraTela(v.valor)])));
  const [gaveta, setGaveta] = useState(paraTela(enviado?.dinheiro_gaveta));
  const [sangria, setSangria] = useState(paraTela(enviado?.sangria));
  const [troco, setTroco] = useState(enviado && Number(enviado.troco_do_cofre) ? paraTela(enviado.troco_do_cofre) : "");
  const [fundo, setFundo] = useState(paraTela(enviado?.fundo_abertura));
  const [obs, setObs] = useState(enviado?.observacao ?? "");
  const [msg, setMsg] = useState<{ erro?: string; ok?: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  const travado = Boolean(enviado?.conferido);
  const fica = ler(gaveta) - ler(sangria);

  function enviar() {
    if (gaveta.trim() === "") { setMsg({ erro: "Informe o dinheiro contado na gaveta (antes da sangria)." }); return; }
    if (fica < 0) { setMsg({ erro: "A sangria é maior que o dinheiro contado na gaveta." }); return; }
    iniciar(async () => {
      const r = await enviarFechamentoCaixa(unidadeId, {
        data, caixa, fundo_abertura: fundo, dinheiro_gaveta: gaveta, sangria, troco_do_cofre: troco, observacao: obs,
        valores: grupos.map((g) => ({ grupo: g, valor: valores[g] ?? "" })),
      });
      setMsg(r.error ? { erro: r.error } : { ok: r.ok });
      if (!r.error) router.refresh();
    });
  }

  return (
    <>
      <div className="form-group" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" defaultValue={data} max={hoje} aria-label="Dia do caixa"
          onChange={(e) => e.target.value && router.push(`/caixa?unidade=${unidadeId}&data=${e.target.value}`)} style={{ width: "auto" }} />
        <input value={caixa} onChange={(e) => setCaixa(e.target.value)} aria-label="Qual caixa" placeholder="Caixa" style={{ width: 160 }} disabled={enviando} />
        {dia.fechamentos.length > 0 && (
          <span className="items-count" style={{ margin: 0 }}>
            Já enviados neste dia: {dia.fechamentos.map((f) => `${f.caixa}${f.conferido ? " (conferido)" : ""}`).join(", ")}
          </span>
        )}
      </div>
      {travado && <div className="empty-state" style={{ marginBottom: 12 }}>Este caixa já foi conferido pelo financeiro. Para corrigir, fale com o financeiro.</div>}

      <h3 style={{ fontSize: 14, margin: "12px 0 6px" }}>Quanto deu cada forma (relatório da maquininha e do Saipos)</h3>
      {grupos.map((g) => (
        <Campo key={g} rotulo={g} valor={valores[g] ?? ""} mudar={(v) => setValores((s) => ({ ...s, [g]: v }))} travado={travado} />
      ))}

      <h3 style={{ fontSize: 14, margin: "16px 0 6px" }}>Dinheiro</h3>
      <Campo rotulo="Dinheiro contado na gaveta" ajuda="Tudo o que há na gaveta ao fechar, antes de tirar a sangria" valor={gaveta} mudar={setGaveta} travado={travado} />
      <Campo rotulo="Sangria (vai para o cofre)" valor={sangria} mudar={setSangria} travado={travado} />
      <Campo rotulo="Troco que veio do cofre hoje" ajuda="Só se reforçaram o troco com dinheiro do cofre" valor={troco} mudar={setTroco} travado={travado} />
      <Campo rotulo="Troco na gaveta ao abrir" ajuda="O que havia na gaveta quando o caixa abriu" valor={fundo} mudar={setFundo} travado={travado} />
      <p className="items-count">Fica na gaveta para amanhã: <strong>{reais(fica)}</strong></p>

      <div className="form-group">
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Observação (diferença que você já sabe, estorno, troco errado…)"
          aria-label="Observação" disabled={travado} />
      </div>

      {!travado && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn-primary" disabled={enviando} onClick={enviar}>
            {enviando ? "Enviando…" : enviado ? "Corrigir o fechamento" : "Fechar o caixa"}
          </button>
          {msg?.erro && <span className="login-error">{msg.erro}</span>}
          {msg?.ok && <span className="items-count">{msg.ok}</span>}
        </div>
      )}
    </>
  );
}
