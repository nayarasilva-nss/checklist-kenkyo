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
const soma = (l: string[]) => l.reduce((s, v) => s + ler(v), 0);

const estiloValor = (valor: string, largura = 120) => ({
  width: largura, textAlign: "right" as const, fontSize: 17, padding: "8px 10px", borderRadius: 8, flex: "none",
  border: `1px solid ${Number.isNaN(ler(valor)) ? "#c9252b" : "#c9c9cd"}`, background: valor === "" ? "#fff" : "#f1f8f3",
});

function Campo({ rotulo, ajuda, valor, mudar, travado }: { rotulo: string; ajuda?: string; valor: string; mudar: (v: string) => void; travado: boolean }) {
  return (
    <div className="list-item" style={{ alignItems: "center" }}>
      <div className="info" style={{ minWidth: 0 }}>
        <h4 style={{ margin: 0 }}>{rotulo}</h4>
        {ajuda && <p style={{ margin: 0 }}>{ajuda}</p>}
      </div>
      <input value={valor} onChange={(e) => mudar(e.target.value)} inputMode="decimal" autoComplete="off" disabled={travado}
        aria-label={rotulo} placeholder="R$ 0,00" style={estiloValor(valor)} />
    </div>
  );
}

type Terminal = { nome: string; valores: Record<string, string> };
type Par = { a: string; valor: string };

function terminaisDe(f: FechamentoCaixa | undefined): Terminal[] {
  const nomes = [...new Set((f?.valores ?? []).filter((v) => v.terminal !== "").map((v) => v.terminal))];
  if (nomes.length === 0) return [{ nome: "1", valores: {} }];
  return nomes.map((nome) => ({
    nome, valores: Object.fromEntries(f!.valores.filter((v) => v.terminal === nome).map((v) => [v.grupo, paraTela(v.valor)])),
  }));
}

/**
 * O fechamento de um caixa num dia, como a planilha de fechamento: cada maquininha (nº do terminal) por bandeira e
 * Pix, o voucher com o código, o dinheiro das vendas, a cortesia, as saídas pagas com o dinheiro do caixa, o
 * suprimento, a sangria (vai para o cofre) e o troco final (fica na gaveta).
 */
export function CaixaForm({ unidadeId, data, hoje, desde, dia }: { unidadeId: number; data: string; hoje: string; desde: string; dia: CaixaDoDia }) {
  const router = useRouter();
  const enviado: FechamentoCaixa | undefined = dia.fechamentos[0];
  const [caixa, setCaixa] = useState(enviado?.caixa ?? "Caixa");
  const [terminais, setTerminais] = useState<Terminal[]>(() => terminaisDe(enviado));
  const fora = ["Dinheiro", "Cortesia", ...dia.outras];
  const [outras, setOutras] = useState<Record<string, string>>(() =>
    Object.fromEntries((enviado?.valores ?? []).filter((v) => v.terminal === "").map((v) => [v.grupo, paraTela(v.valor)])));
  const [vouchers, setVouchers] = useState<Par[]>(() => enviado?.vouchers.length ? enviado.vouchers.map((v) => ({ a: v.codigo, valor: paraTela(v.valor) })) : [{ a: "", valor: "" }]);
  const [saidas, setSaidas] = useState<Par[]>(() => enviado?.saidas.length ? enviado.saidas.map((s) => ({ a: s.finalidade, valor: paraTela(s.valor) })) : [{ a: "", valor: "" }]);
  const [suprimento, setSuprimento] = useState(enviado && Number(enviado.troco_do_cofre) ? paraTela(enviado.troco_do_cofre) : "");
  const [sangria, setSangria] = useState(paraTela(enviado?.sangria));
  const [trocoFinal, setTrocoFinal] = useState(paraTela(enviado?.troco_final));
  const [fundo, setFundo] = useState(paraTela(enviado?.fundo_abertura));
  const [obs, setObs] = useState(enviado?.observacao ?? "");
  const [msg, setMsg] = useState<{ erro?: string; ok?: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  const travado = Boolean(enviado?.conferido);

  const linhasCartao = dia.linhas_maquininha.filter((l) => l !== "Pix");
  const cartoes = soma(terminais.flatMap((t) => linhasCartao.map((l) => t.valores[l] ?? "")));
  const pix = soma(terminais.map((t) => t.valores["Pix"] ?? ""));
  const totalVoucher = soma(vouchers.map((v) => v.valor));
  const totalSaidas = soma(saidas.map((s) => s.valor));

  const mudarTerminal = (i: number, f: (t: Terminal) => Terminal) => setTerminais((ts) => ts.map((t, j) => (j === i ? f(t) : t)));

  function enviar() {
    if (trocoFinal.trim() === "") { setMsg({ erro: "Informe o troco final (o dinheiro que fica na gaveta)." }); return; }
    const nomes = terminais.map((t) => t.nome.trim());
    if (nomes.some((n) => !n) || new Set(nomes).size !== nomes.length) { setMsg({ erro: "Dê um número diferente a cada maquininha." }); return; }
    iniciar(async () => {
      const r = await enviarFechamentoCaixa(unidadeId, {
        data, caixa, fundo_abertura: fundo, suprimento, sangria, troco_final: trocoFinal, observacao: obs,
        valores: [
          ...terminais.flatMap((t) => dia.linhas_maquininha.map((l) => ({ terminal: t.nome.trim(), grupo: l, valor: t.valores[l] ?? "" }))),
          ...fora.map((g) => ({ terminal: "", grupo: g, valor: outras[g] ?? "" })),
        ],
        vouchers: vouchers.map((v) => ({ codigo: v.a, valor: v.valor })),
        saidas: saidas.map((s) => ({ finalidade: s.a, valor: s.valor })),
      });
      setMsg(r.error ? { erro: r.error } : { ok: r.ok });
      if (!r.error) router.refresh();
    });
  }

  const titulo = (t: string) => <h3 style={{ fontSize: 14, margin: "18px 0 6px" }}>{t}</h3>;

  return (
    <>
      <div className="form-group" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" defaultValue={data} min={desde} max={hoje} aria-label="Dia do caixa"
          onChange={(e) => e.target.value && router.push(`/caixa?unidade=${unidadeId}&data=${e.target.value}`)} style={{ width: "auto" }} />
        <input value={caixa} onChange={(e) => setCaixa(e.target.value)} aria-label="Qual caixa" placeholder="Caixa" style={{ width: 160 }} disabled={enviando || travado} />
        {enviado && <span className="items-count" style={{ margin: 0 }}>Enviado por {enviado.quem_fechou ?? "—"}{travado ? " · conferido pelo financeiro" : " · pode corrigir"}</span>}
      </div>
      {travado && <div className="empty-state" style={{ marginBottom: 12 }}>Este caixa já foi conferido pelo financeiro. Para corrigir, fale com o financeiro.</div>}

      {titulo("Recebimentos nas maquininhas")}
      {terminais.map((t, i) => (
        <div key={i} style={{ marginBottom: 12, padding: "8px 10px", border: "1px solid #e4e4e7", borderRadius: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <strong style={{ fontSize: 14 }}>Nº do terminal</strong>
            <input value={t.nome} onChange={(e) => mudarTerminal(i, (x) => ({ ...x, nome: e.target.value }))} aria-label="Número do terminal"
              style={{ width: 120 }} disabled={travado} />
            {!travado && terminais.length > 1 && (
              <button type="button" className="btn-small" onClick={() => setTerminais((ts) => ts.filter((_, j) => j !== i))}>Tirar</button>
            )}
          </div>
          {dia.linhas_maquininha.map((l) => (
            <Campo key={l} rotulo={l} valor={t.valores[l] ?? ""} travado={travado}
              mudar={(v) => mudarTerminal(i, (x) => ({ ...x, valores: { ...x.valores, [l]: v } }))} />
          ))}
        </div>
      ))}
      {!travado && (
        <button type="button" className="btn-small" onClick={() => setTerminais((ts) => [...ts, { nome: String(ts.length + 1), valores: {} }])}>
          + Outra maquininha
        </button>
      )}

      {titulo("Outros recebimentos")}
      {fora.map((g) => (
        <Campo key={g} rotulo={g} valor={outras[g] ?? ""} travado={travado}
          ajuda={g === "Dinheiro" ? "As vendas recebidas em dinheiro" : g === "Cortesia" ? "O que saiu de cortesia" : undefined}
          mudar={(v) => setOutras((s) => ({ ...s, [g]: v }))} />
      ))}

      {titulo("Voucher (Experience Card)")}
      {vouchers.map((v, i) => (
        <div key={i} className="list-item" style={{ alignItems: "center", gap: 8 }}>
          <input value={v.a} onChange={(e) => setVouchers((l) => l.map((x, j) => (j === i ? { ...x, a: e.target.value.toUpperCase() } : x)))}
            placeholder="Código (ex.: KEN1-005)" aria-label="Código do voucher" disabled={travado} style={{ flex: 1, minWidth: 0 }} />
          <input value={v.valor} onChange={(e) => setVouchers((l) => l.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
            inputMode="decimal" placeholder="R$ 0,00" aria-label="Valor do voucher" disabled={travado} style={estiloValor(v.valor)} />
        </div>
      ))}
      {!travado && <button type="button" className="btn-small" onClick={() => setVouchers((l) => [...l, { a: "", valor: "" }])}>+ Outro voucher</button>}

      {titulo("Saídas (pagas com o dinheiro do caixa)")}
      {saidas.map((s, i) => (
        <div key={i} className="list-item" style={{ alignItems: "center", gap: 8 }}>
          <input value={s.a} onChange={(e) => setSaidas((l) => l.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
            placeholder="Finalidade (ex.: gelo, motoboy)" aria-label="Finalidade da saída" disabled={travado} style={{ flex: 1, minWidth: 0 }} />
          <input value={s.valor} onChange={(e) => setSaidas((l) => l.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
            inputMode="decimal" placeholder="R$ 0,00" aria-label="Valor da saída" disabled={travado} style={estiloValor(s.valor)} />
        </div>
      ))}
      {!travado && <button type="button" className="btn-small" onClick={() => setSaidas((l) => [...l, { a: "", valor: "" }])}>+ Outra saída</button>}

      {titulo("Fechamento do dinheiro")}
      <Campo rotulo="Suprimento" ajuda="Dinheiro que veio do cofre para reforçar o troco" valor={suprimento} mudar={setSuprimento} travado={travado} />
      <Campo rotulo="Sangria" ajuda="O que sai da gaveta e vai para o cofre" valor={sangria} mudar={setSangria} travado={travado} />
      <Campo rotulo="Troco final" ajuda="O dinheiro que fica na gaveta para amanhã" valor={trocoFinal} mudar={setTrocoFinal} travado={travado} />
      <Campo rotulo="Troco ao abrir" ajuda="Só no primeiro fechamento pelo app: o que havia na gaveta quando o caixa abriu" valor={fundo} mudar={setFundo} travado={travado} />

      <div className="list-item" style={{ display: "block" }}>
        <p className="items-count" style={{ margin: 0 }}>
          Cartões {reais(cartoes)} · Pix {reais(pix)} · Voucher {reais(totalVoucher)} · Dinheiro {reais(ler(outras["Dinheiro"] ?? ""))}
          {totalSaidas ? ` · Saídas ${reais(totalSaidas)}` : ""}
        </p>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Observações"
          aria-label="Observações" disabled={travado} />
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
