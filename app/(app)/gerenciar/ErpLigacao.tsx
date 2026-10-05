"use client";

import { useMemo, useState, useTransition } from "react";
import { aplicarEspelhoErp, enviarConferidasDesde, salvarItensErp, salvarSetoresFuncoes, salvarUnidadesErp, tentarPendentesErp, verEspelhoErp, type ActionState, type EstadoEspelho } from "@/lib/actions/erp";
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

/**
 * Unidade do checklist → empresa do ERP. O local de onde sai a requisição é
 * regra, não escolha: interna do "Estoque local" da unidade, externa do
 * "Estoque central" do Empório (a mercadoria continua sendo da unidade).
 */
export function UnidadesErp({ unidades, empresas, locais }: { unidades: Unidade[]; empresas: Empresa[]; locais: Local[] }) {
  const [cnpjs, setCnpjs] = useState<Record<number, string>>(() => Object.fromEntries(unidades.map((u) => [u.id, u.erpCnpj ?? ""])));
  const [estado, setEstado] = useState<ActionState>();
  const [salvando, iniciar] = useTransition();
  const centrais = new Set(empresas.filter((e) => e.tipo === "central").map((e) => e.cnpj));
  const localDe = (cnpj: string, nome: string) => locais.find((l) => l.unidade_cnpj === cnpj && l.nome.toUpperCase() === nome.toUpperCase());
  const central = locais.find((l) => centrais.has(l.unidade_cnpj) && l.nome.toUpperCase() === "ESTOQUE CENTRAL");
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
              {!cnpjs[u.id] ? "—" : localDe(cnpjs[u.id]!, "Estoque local")
                ? `${localDe(cnpjs[u.id]!, "Estoque local")!.unidade} · Estoque local`
                : <span className="login-error" style={{ margin: 0 }}>falta o &quot;Estoque local&quot; no ERP</span>}
            </td>
            <td>
              {!cnpjs[u.id] ? "—" : central
                ? `${central.unidade} · Estoque central`
                : <span className="login-error" style={{ margin: 0 }}>falta o &quot;Estoque central&quot; do Empório no ERP</span>}
            </td>
          </tr>
        ))}</tbody>
      </table>
      <p className="items-count" style={{ marginTop: 10 }}>De onde sai é regra: requisição interna do &quot;Estoque local&quot; da unidade, externa do &quot;Estoque central&quot; do Empório. A mercadoria continua sendo da unidade que pediu.</p>
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

/** Catálogo daqui = catálogo do ERP. Primeiro mostra o que muda; aplica só depois. */
export function EspelharCatalogo() {
  const [estado, setEstado] = useState<EstadoEspelho>();
  const [rodando, iniciar] = useTransition();
  const plano = estado?.plano;
  const lista = (titulo: string, itens: string[]) => itens.length === 0 ? null : (
    <details style={{ marginTop: 6 }}>
      <summary className="items-count" style={{ cursor: "pointer" }}>{titulo} · {itens.length}</summary>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18, maxHeight: 260, overflow: "auto" }}>{itens.map((t, i) => <li key={i} className="items-count">{t}</li>)}</ul>
    </details>
  );
  return (
    <div>
      <p className="items-count" style={{ marginBottom: 10 }}>
        Deixa a lista de produtos daqui igual à do ERP: mesmo nome, categoria e unidade, cada um já ligado ao item de lá.
        Só continua o produto que já está ligado a um item do ERP em &quot;Produtos do catálogo&quot; (abaixo); o resto sai e o item do ERP entra novo.
        Dois produtos ligados ao mesmo item viram um só (as requisições antigas passam para ele). O que sai e já foi pedido fica desativado, com o histórico; o que nunca foi pedido é excluído.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn-small" type="button" disabled={rodando} onClick={() => iniciar(async () => setEstado(await verEspelhoErp()))}>
          {rodando && !plano ? "Lendo o ERP…" : "Ver o que muda"}
        </button>
        {plano && !estado?.aplicado && (
          <button className="btn-save" type="button" disabled={rodando} onClick={() => {
            if (!confirm(`Aplicar? ${plano.criar.length} novos, ${plano.renomear.length} renomeados, ${plano.juntar.length} juntados, ${plano.desativar.length} desativados e ${plano.excluir.length} excluídos.`)) return;
            iniciar(async () => setEstado(await aplicarEspelhoErp()));
          }}>{rodando ? "Aplicando…" : "Aplicar"}</button>
        )}
        {estado?.error && <p className="login-error" style={{ margin: 0 }}>{estado.error}</p>}
        {estado?.ok && <p className="items-count" style={{ margin: 0, color: "var(--success-text)" }}>{estado.ok}</p>}
      </div>
      {plano && (
        <div style={{ marginTop: 12 }}>
          <p className="items-count" style={{ margin: 0 }}>
            {estado?.aplicado ? "Feito: " : "Vai mudar: "}
            {plano.criar.length} novos · {plano.renomear.length} renomeados · {plano.manter} já iguais · {plano.juntar.length} juntados · {plano.desativar.length} desativados · {plano.excluir.length} excluídos
          </p>
          {lista("Renomeados", plano.renomear.map((r) => `${r.de} → ${r.para}`))}
          {lista("Juntados", plano.juntar.map((j) => `${j.nome} → ${j.em}`))}
          {lista("Novos", plano.criar.map((c) => c.nome))}
          {lista("Desativados (já pedidos, o ERP não tem)", plano.desativar.map((d) => d.nome))}
          {lista("Excluídos (nunca pedidos, o ERP não tem)", plano.excluir.map((d) => d.nome))}
        </div>
      )}
    </div>
  );
}
