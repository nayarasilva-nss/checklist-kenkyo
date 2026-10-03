"use client";

import { useMemo, useState, useTransition } from "react";
import { enviarConferidasDesde, salvarItensErp, salvarSetoresFuncoes, salvarUnidadesErp, tentarPendentesErp, type ActionState } from "@/lib/actions/erp";
import { sugerirFator, sugerirItemErp, type ItemErp } from "@/lib/erp/sugestao";

type Local = { id: number; nome: string; tipo: string; unidade_cnpj: string; unidade: string };
type Empresa = { cnpj: string; nome: string; tipo: string };
type Unidade = { id: number; name: string; erpCnpj: string | null; erpLocalInternoId: number | null; erpLocalExternoId: number | null };
type Produto = { id: number; name: string; unitMeasure: string; erpItemCodigo: string | null; erpFator: string | null };

function Mensagem({ estado }: { estado: ActionState }) {
  if (estado?.error) return <p className="login-error" style={{ margin: 0 }}>{estado.error}</p>;
  if (estado?.ok) return <p className="items-count" style={{ margin: 0, color: "var(--success-text)" }}>{estado.ok}</p>;
  return null;
}

const rotulo = (i: ItemErp) => `${i.codigo} — ${i.nome} (${i.unidade_uso})`;

/** Unidade do checklist → empresa do ERP e os locais de onde sai a requisição. */
export function UnidadesErp({ unidades, empresas, locais }: { unidades: Unidade[]; empresas: Empresa[]; locais: Local[] }) {
  const [cnpjs, setCnpjs] = useState<Record<number, string>>(() => Object.fromEntries(unidades.map((u) => [u.id, u.erpCnpj ?? ""])));
  const [estado, setEstado] = useState<ActionState>();
  const [salvando, iniciar] = useTransition();
  const centrais = new Set(empresas.filter((e) => e.tipo === "central").map((e) => e.cnpj));
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); iniciar(async () => setEstado(await salvarUnidadesErp(undefined, fd))); }}>
      <table className="ranking-table">
        <thead><tr><th>Unidade aqui</th><th>Empresa no ERP</th><th>Requisição interna sai de</th><th>Requisição externa sai de</th></tr></thead>
        <tbody>{unidades.map((u) => (
          <tr key={u.id}>
            <td><strong>{u.name}</strong></td>
            <td>
              <select name={`cnpj-${u.id}`} value={cnpjs[u.id] ?? ""} onChange={(e) => setCnpjs({ ...cnpjs, [u.id]: e.target.value })}>
                <option value="">— não ligar —</option>
                {empresas.map((e) => <option key={e.cnpj} value={e.cnpj}>{e.nome}</option>)}
              </select>
            </td>
            <td>
              <select name={`interno-${u.id}`} defaultValue={u.erpLocalInternoId ?? ""}>
                <option value="">—</option>
                {locais.filter((l) => l.unidade_cnpj === cnpjs[u.id]).map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </td>
            <td>
              <select name={`externo-${u.id}`} defaultValue={u.erpLocalExternoId ?? ""}>
                <option value="">—</option>
                {locais.filter((l) => centrais.has(l.unidade_cnpj)).map((l) => <option key={l.id} value={l.id}>{l.unidade} · {l.nome}</option>)}
              </select>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {locais.length === 0 && <p className="items-count" style={{ marginTop: 10 }}>O ERP ainda não tem locais de estoque cadastrados (Cadastros › Empresa › Locais de estoque, no ERP). Sem local, a requisição fica aguardando.</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <button className="btn-save" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar unidades"}</button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

/** Produto do catálogo → item do ERP e fator. Sugestão pelo nome; o gestor confere e salva. */
export function ProdutosErp({ produtos, itens }: { produtos: Produto[]; itens: ItemErp[] }) {
  const porCodigo = useMemo(() => new Map(itens.map((i) => [i.codigo, i])), [itens]);
  const linhasIniciais = useMemo(() => produtos.map((p) => {
    const salvo = p.erpItemCodigo ? porCodigo.get(p.erpItemCodigo) : undefined;
    const sugerido = salvo ? null : sugerirItemErp(p.name, itens);
    const item = salvo ?? sugerido ?? null;
    const fator = p.erpFator ? String(Number(p.erpFator)) : item ? String(sugerirFator(p.unitMeasure, item.unidade_uso) ?? "") : "";
    return { ...p, escolha: item ? rotulo(item) : "", fator, sugerido: Boolean(sugerido), ligado: Boolean(salvo) };
  }), [produtos, itens, porCodigo]);
  const [linhas, setLinhas] = useState(linhasIniciais);
  const [filtro, setFiltro] = useState<"todos" | "sem" | "sugeridos">("sem");
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState<ActionState>();
  const [salvando, iniciar] = useTransition();

  const mudar = (id: number, campo: "escolha" | "fator", valor: string) =>
    setLinhas((ls) => ls.map((l) => {
      if (l.id !== id) return l;
      if (campo === "fator") return { ...l, fator: valor };
      const item = porCodigo.get(valor.split(" — ")[0]!.trim());
      const fator = item ? String(sugerirFator(l.unitMeasure, item.unidade_uso) ?? l.fator) : l.fator;
      return { ...l, escolha: valor, fator, sugerido: false };
    }));
  const termo = busca.trim().toLowerCase();
  const visivel = (l: (typeof linhas)[number]) =>
    (filtro === "todos" || (filtro === "sem" && !l.ligado) || (filtro === "sugeridos" && l.sugerido)) &&
    (!termo || l.name.toLowerCase().includes(termo) || l.escolha.toLowerCase().includes(termo));
  const semLigacao = linhas.filter((l) => !l.ligado).length;
  const sugeridos = linhas.filter((l) => l.sugerido).length;

  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); iniciar(async () => {
      const r = await salvarItensErp(undefined, fd);
      setEstado(r);
      if (r?.ok) setLinhas((ls) => ls.map((l) => ({ ...l, ligado: Boolean(l.escolha) && Number(l.fator.replace(",", ".")) > 0, sugerido: false })));
    }); }}>
      <datalist id="itens-erp">{itens.map((i) => <option key={i.codigo} value={rotulo(i)} />)}</datalist>
      <div className="filter-pills" style={{ marginBottom: 10 }}>
        <button type="button" className={`pill${filtro === "sem" ? " active" : ""}`} onClick={() => setFiltro("sem")}>Sem ligação · {semLigacao}</button>
        <button type="button" className={`pill${filtro === "sugeridos" ? " active" : ""}`} onClick={() => setFiltro("sugeridos")}>Sugeridos pelo nome · {sugeridos}</button>
        <button type="button" className={`pill${filtro === "todos" ? " active" : ""}`} onClick={() => setFiltro("todos")}>Todos · {linhas.length}</button>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)" }} aria-label="Buscar produto" />
      </div>
      <table className="ranking-table">
        <thead><tr><th>Produto aqui</th><th>Item do ERP</th><th>Fator</th></tr></thead>
        <tbody>{linhas.map((l) => (
          <tr key={l.id} style={visivel(l) ? undefined : { display: "none" }}>
            <td>
              <input type="hidden" name="item" value={l.id} />
              <strong>{l.name}</strong> <span className="items-count">({l.unitMeasure})</span>
              {l.sugerido && <span className="status-pill pending" style={{ marginLeft: 6 }}>sugerido · confira</span>}
              {l.escolha && !(Number(l.fator.replace(",", ".")) > 0) && <span className="status-pill pending" style={{ marginLeft: 6 }}>falta o fator</span>}
            </td>
            <td style={{ minWidth: 320 }}>
              <input name={`erp-${l.id}`} list="itens-erp" value={l.escolha} onChange={(e) => mudar(l.id, "escolha", e.target.value)}
                placeholder="digite para buscar no ERP" style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)" }} aria-label={`Item do ERP para ${l.name}`} />
            </td>
            <td style={{ width: 150 }}>
              <input name={`fator-${l.id}`} value={l.fator} onChange={(e) => mudar(l.id, "fator", e.target.value)} inputMode="decimal"
                style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)" }} aria-label={`Fator de ${l.name}`} />
              {(() => { const it = porCodigo.get(l.escolha.split(" — ")[0]!.trim()); return it ? <div className="items-count" style={{ marginTop: 2 }}>{it.unidade_uso} por {l.unitMeasure}</div> : null; })()}
            </td>
          </tr>
        ))}</tbody>
      </table>
      <p className="items-count" style={{ marginTop: 10 }}>
        Fator = quanto da unidade do ERP vem em 1 unidade do produto aqui. Pedido em g e ERP em KG: 0,001. Pedido em un e ERP em un: 1. Caixa com 12 garrafas e ERP em garrafa: 12.
        As sugestões são pelo nome e só valem depois de salvas; produto com item escolhido e sem fator não é ligado. Apague o item do ERP para desligar um produto.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, position: "sticky", bottom: 0, background: "var(--bg, transparent)", padding: "8px 0" }}>
        <button className="btn-save" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar ligações"}</button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}

export function TentarPendentes() {
  const [estado, setEstado] = useState<ActionState>();
  const [enviando, iniciar] = useTransition();
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button className="btn-small" type="button" disabled={enviando} onClick={() => iniciar(async () => setEstado(await tentarPendentesErp()))}>{enviando ? "Enviando…" : "Tentar de novo agora"}</button>
      <Mensagem estado={estado} />
    </span>
  );
}

export function EnviarAntigas({ quantas }: { quantas: number }) {
  const [estado, setEstado] = useState<ActionState>();
  const [enviando, iniciar] = useTransition();
  return (
    <form style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); if (!confirm("Mandar ao ERP as requisições conferidas a partir desta data? Cada uma vira baixa de estoque lá.")) return; iniciar(async () => setEstado(await enviarConferidasDesde(undefined, fd))); }}>
      <span className="items-count">{quantas} conferida{quantas === 1 ? "" : "s"} de antes da ligação. Mandar as conferidas a partir de</span>
      <input type="date" name="desde" required style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)" }} />
      <button className="btn-small" type="submit" disabled={enviando}>{enviando ? "Colocando na fila…" : "Mandar ao ERP"}</button>
      <Mensagem estado={estado} />
    </form>
  );
}

/** Função do checklist → setor do ERP: na requisição, cada um vê só os produtos do seu setor. */
export function SetoresFuncoes({ funcoes, setores }: { funcoes: { id: number; name: string; erpSetor: string | null }[]; setores: string[] }) {
  const [estado, setEstado] = useState<ActionState>();
  const [salvando, iniciar] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); iniciar(async () => setEstado(await salvarSetoresFuncoes(undefined, fd))); }}>
      <table className="ranking-table">
        <thead><tr><th>Função</th><th>Setor no ERP</th></tr></thead>
        <tbody>{funcoes.map((f) => (
          <tr key={f.id}>
            <td><strong>{f.name}</strong></td>
            <td>
              <select name={`setor-${f.id}`} defaultValue={f.erpSetor ?? ""}>
                <option value="">— vê todos os produtos —</option>
                {f.erpSetor && !setores.includes(f.erpSetor) && <option value={f.erpSetor}>{f.erpSetor} (não existe mais no ERP)</option>}
                {setores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
          </tr>
        ))}</tbody>
      </table>
      <p className="items-count" style={{ marginTop: 10 }}>
        Quais produtos são de cada setor se marca no ERP (Cadastros › Itens). Produto sem setor no ERP aparece para todos, e quem quiser pedir de outro setor tem o &quot;ver todos&quot; no formulário. Gestor e gerente sempre veem tudo.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <button className="btn-save" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar setores"}</button>
        <Mensagem estado={estado} />
      </div>
    </form>
  );
}
