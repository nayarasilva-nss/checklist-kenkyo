"use client";

import { useMemo, useState, useTransition } from "react";
import { createRequisicao } from "@/lib/actions/requisicoes";

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

export function NovaRequisicaoForm({
  tiposPermitidos,
  categorias,
  catalogItems,
  onSuccess,
}: {
  tiposPermitidos: ("interna" | "externa")[];
  categorias: { id: number; name: string }[];
  catalogItems: CatalogItem[];
  onSuccess: () => void;
}) {
  const [tipo, setTipo] = useState(tiposPermitidos[0] ?? "interna");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<number | "todas">("todas");
  const [selecionados, setSelecionados] = useState<Record<number, SelectedItem>>({});
  const [customNome, setCustomNome] = useState("");
  const [customUnidade, setCustomUnidade] = useState("un");
  const [urgente, setUrgente] = useState(false);
  const [observacao, setObservacao] = useState("");
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
    if (totalItens === 0) {
      setError("Selecione ao menos um item");
      return;
    }
    const fd = new FormData();
    fd.set("tipo", tipo);
    fd.set("urgente", urgente ? "on" : "off");
    fd.set("observacao", observacao);
    fd.set("itensJson", JSON.stringify(Object.values(selecionados)));

    startTransition(async () => {
      const result = await createRequisicao(undefined, fd);
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
      {tiposPermitidos.length > 1 && (
        <div className="filter-pills">
          {tiposPermitidos.map((t) => (
            <button
              key={t}
              type="button"
              className={`pill${tipo === t ? " active" : ""}`}
              onClick={() => setTipo(t)}
            >
              {t === "interna" ? "Interna" : "Externa"}
            </button>
          ))}
        </div>
      )}

      <div className="form-group">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar item..."
        />
      </div>

      <div className="filter-pills">
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
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 260, overflowY: "auto", margin: "10px 0" }}>
        {listaFiltrada.map((item) => {
          const sel = selecionados[item.id];
          return (
            <div key={item.id} className="list-item">
              <div className="info">
                <h4>{item.name}</h4>
                <p>{item.categoryName ?? "Sem categoria"}</p>
              </div>
              <div className="list-item-actions">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={sel?.qtdPedida ?? 0}
                  onChange={(e) => setQtd(item, Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: 64 }}
                />
                <span>{item.unitMeasure}</span>
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
        <div style={{ display: "flex", gap: 8 }}>
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

      <div className="inline-form-buttons">
        <span className="pill-count">
          {totalItens} {totalItens === 1 ? "item selecionado" : "itens selecionados"}
        </span>
        <button className="btn-save" type="submit" disabled={isPending}>
          Enviar requisição
        </button>
      </div>
    </form>
  );
}
