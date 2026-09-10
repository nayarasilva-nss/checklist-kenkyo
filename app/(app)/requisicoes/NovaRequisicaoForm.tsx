"use client";

import { useMemo, useState, useTransition } from "react";
import { createRequisicao, updateRequisicao } from "@/lib/actions/requisicoes";
import { QuantidadeStepper } from "./QuantidadeStepper";

type CatalogItem = {
  id: number;
  name: string;
  unitMeasure: string;
  categoryId: number | null;
  categoryName: string | null;
};

type SelectedItem = {
  catalogItemId: number | null;
  nome: string;
  unidadeMedida: string;
  qtdPedida: number;
};

export type EditingRequisicao = {
  id: number;
  tipo: "interna" | "externa";
  urgente: boolean;
  observacao: string;
  itens: { catalogItemId: number | null; nome: string; unidadeMedida: string; qtdPedida: number }[];
};

type LinkCandidate = { id: number; createdAt: Date; requesterName: string };

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NovaRequisicaoForm({
  tiposPermitidos,
  categorias,
  catalogItems,
  units,
  todayWeekday,
  editing,
  onSuccess,
  linkCandidates,
}: {
  tiposPermitidos: ("interna" | "externa")[];
  categorias: { id: number; name: string; orderDays: number[] }[];
  catalogItems: CatalogItem[];
  // Só passado (não-vazio) pra quem não tem unidade fixa — hoje, Gestor —
  // que por isso precisa escolher pra qual unidade é a requisição.
  units: { id: number; name: string }[];
  // 0=domingo..6=sábado, calculado no servidor (hora de Brasília).
  todayWeekday: number;
  // Presente = editando uma requisição já enviada em vez de criar uma nova.
  editing?: EditingRequisicao;
  onSuccess: () => void;
  // Requisições de hoje (mesma unidade) que dá pra apontar como
  // "original" quando isso aqui é o excedente de algo já enviado —
  // ausente ao editar (não faz sentido vincular uma edição).
  linkCandidates?: { interna: LinkCandidate[]; externa: LinkCandidate[] };
}) {
  const categoriasHoje = categorias.filter((c) => c.orderDays.includes(todayWeekday));
  // Quando só há uma opção (ou já estamos editando), não há o que
  // escolher — senão o tipo começa em branco e a pessoa precisa
  // selecionar Interna/Externa antes de enviar (ver handleSubmit).
  const [tipo, setTipo] = useState<"interna" | "externa" | null>(
    editing?.tipo ?? (tiposPermitidos.length === 1 ? tiposPermitidos[0] : null),
  );
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [relatedRequisicaoId, setRelatedRequisicaoId] = useState<number | "">("");
  const candidatosVinculo = tipo ? (linkCandidates?.[tipo] ?? []) : [];
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<number | "todas">("todas");
  const [selecionados, setSelecionados] = useState<Record<number, SelectedItem>>(() => {
    if (!editing) return {};
    const initial: Record<number, SelectedItem> = {};
    editing.itens.forEach((item, i) => {
      initial[item.catalogItemId ?? -(i + 1)] = item;
    });
    return initial;
  });
  const [customNome, setCustomNome] = useState("");
  const [customUnidade, setCustomUnidade] = useState("un");
  const [urgente, setUrgente] = useState(editing?.urgente ?? false);
  const [observacao, setObservacao] = useState(editing?.observacao ?? "");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const listaFiltrada = useMemo(() => {
    return catalogItems.filter((item) => {
      const bateCategoria = categoria === "todas" || item.categoryId === categoria;
      const bateBusca = item.name.toLowerCase().includes(busca.toLowerCase());
      return bateCategoria && bateBusca;
    });
  }, [catalogItems, categoria, busca]);

  function setQtd(item: CatalogItem, qtd: number) {
    setSelecionados((prev) => {
      const next = { ...prev };
      if (qtd <= 0) {
        delete next[item.id];
      } else {
        next[item.id] = {
          catalogItemId: item.id,
          nome: item.name,
          unidadeMedida: item.unitMeasure,
          qtdPedida: qtd,
        };
      }
      return next;
    });
  }

  function adicionarCustom() {
    if (!customNome.trim()) return;
    const key = -Date.now();
    setSelecionados((prev) => ({
      ...prev,
      [key]: {
        catalogItemId: null,
        nome: customNome.trim(),
        unidadeMedida: customUnidade,
        qtdPedida: 1,
      },
    }));
    setCustomNome("");
    setCustomUnidade("un");
  }

  const totalItens = Object.keys(selecionados).length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tipo) {
      setError("Selecione se a requisição é interna ou externa");
      return;
    }
    if (totalItens === 0) {
      setError("Selecione ao menos um item");
      return;
    }
    if (units.length > 0 && !unitId) {
      setError("Selecione a unidade");
      return;
    }
    const fd = new FormData();
    if (editing) fd.set("id", String(editing.id));
    fd.set("tipo", tipo);
    if (units.length > 0) fd.set("unitId", String(unitId));
    fd.set("urgente", urgente ? "on" : "off");
    fd.set("observacao", observacao);
    fd.set("itensJson", JSON.stringify(Object.values(selecionados)));
    if (relatedRequisicaoId) fd.set("relatedRequisicaoId", String(relatedRequisicaoId));

    startTransition(async () => {
      const result = await (editing ? updateRequisicao : createRequisicao)(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        onSuccess();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {!editing && tiposPermitidos.length > 1 && (
        <div className="filter-pills">
          {tiposPermitidos.map((t) => (
            <button
              key={t}
              type="button"
              className={`pill${tipo === t ? " active" : ""}`}
              onClick={() => {
                setTipo(t);
                setRelatedRequisicaoId("");
              }}
            >
              {t === "interna" ? "Interna" : "Externa"}
            </button>
          ))}
        </div>
      )}

      {!editing && candidatosVinculo.length > 0 && (
        <div className="form-group">
          <label htmlFor="relatedRequisicaoId">
            Isso é excedente de uma requisição já enviada?
          </label>
          <select
            id="relatedRequisicaoId"
            value={relatedRequisicaoId}
            onChange={(e) => setRelatedRequisicaoId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Não, é um pedido novo</option>
            {candidatosVinculo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.requesterName} em {formatDateTime(c.createdAt)}
              </option>
            ))}
          </select>
        </div>
      )}

      {units.length > 0 && (
        <div className="form-group">
          <label htmlFor="requisicaoUnidade">Unidade</label>
          <select
            id="requisicaoUnidade"
            value={unitId}
            onChange={(e) => setUnitId(Number(e.target.value))}
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {categoriasHoje.length > 0 && (
        <div
          style={{
            background: "var(--warning-bg)",
            color: "var(--warning-text)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13.5,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          📦 Hoje é dia de pedido: {categoriasHoje.map((c) => c.name).join(", ")}
        </div>
      )}

      <div className="form-group">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar item..."
        />
      </div>

      <div className="filter-pills-scroll">
        <button
          type="button"
          className={`pill${categoria === "todas" ? " active" : ""}`}
          onClick={() => setCategoria("todas")}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`pill${categoria === c.id ? " active" : ""}`}
            onClick={() => setCategoria(c.id)}
          >
            {c.name}
            {c.orderDays.includes(todayWeekday) && (
              <span
                aria-label="Hoje é dia de pedido"
                title="Hoje é dia de pedido"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--kenkyo-red)",
                  marginLeft: 6,
                }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="req-item-list">
        {listaFiltrada.map((item) => {
          const sel = selecionados[item.id];
          return (
            <div key={item.id} className="list-item">
              <div className="info">
                <h4>{item.name}</h4>
                <p>{item.categoryName ?? "Sem categoria"}</p>
              </div>
              <div className="list-item-actions">
                <QuantidadeStepper
                  value={sel?.qtdPedida ?? 0}
                  unidade={item.unitMeasure}
                  onChange={(v) => setQtd(item, v)}
                />
              </div>
            </div>
          );
        })}
        {listaFiltrada.length === 0 && (
          <p style={{ textAlign: "center", padding: 16 }}>Nenhum item encontrado.</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="customNome">Item personalizado</label>
        <div className="req-custom-item-row">
          <input
            id="customNome"
            value={customNome}
            onChange={(e) => setCustomNome(e.target.value)}
            placeholder="Nome do item"
          />
          <select value={customUnidade} onChange={(e) => setCustomUnidade(e.target.value)}>
            {["kg", "g", "un", "L", "ml", "cx", "pct"].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button type="button" className="btn-small" onClick={adicionarCustom}>
            + Adicionar
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="urgente">
          <input
            id="urgente"
            type="checkbox"
            checked={urgente}
            onChange={(e) => setUrgente(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Urgente
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="observacao">Observação</label>
        <input
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="inline-form-buttons req-submit-footer">
        <span className="pill-count">
          {totalItens} {totalItens === 1 ? "item selecionado" : "itens selecionados"}
        </span>
        <button className="btn-save" type="submit" disabled={isPending}>
          {editing ? "Salvar alterações" : "Enviar requisição"}
        </button>
      </div>
    </form>
  );
}
