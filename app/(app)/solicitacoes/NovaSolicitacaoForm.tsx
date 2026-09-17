"use client";

import { useState, useTransition } from "react";
import { createSolicitacao } from "@/lib/actions/solicitacoes";
import { todayISO } from "@/lib/date-utils";

type ItemInput = { nome: string; quantidade: number };

export function NovaSolicitacaoForm({
  units,
  onSuccess,
}: {
  // Só não-vazio pra quem não tem unidade fixa — hoje, Gestor — que por
  // isso precisa escolher pra qual unidade é a solicitação.
  units?: { id: number; name: string }[];
  onSuccess: () => void;
}) {
  const [unitId, setUnitId] = useState(units?.[0]?.id ?? "");
  const [itens, setItens] = useState<ItemInput[]>([]);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [urgente, setUrgente] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function adicionarItem() {
    const nomeTrim = nome.trim();
    const qtd = Number(quantidade);
    if (!nomeTrim || !Number.isFinite(qtd) || qtd <= 0) return;
    setItens((prev) => [...prev, { nome: nomeTrim, quantidade: qtd }]);
    setNome("");
    setQuantidade("1");
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (itens.length === 0) {
      setError("Adicione ao menos um item");
      return;
    }
    if (units && units.length > 0 && !unitId) {
      setError("Selecione a unidade");
      return;
    }

    const fd = new FormData(event.currentTarget);
    if (units && units.length > 0) fd.set("unitId", String(unitId));
    fd.set("urgente", urgente ? "on" : "off");
    fd.set("observacao", observacao);
    fd.set("itensJson", JSON.stringify(itens));

    startTransition(async () => {
      const result = await createSolicitacao(undefined, fd);
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
      {units && units.length > 0 && (
        <div className="form-group">
          <label htmlFor="solicitacaoUnidade">Unidade</label>
          <select
            id="solicitacaoUnidade"
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

      <div className="form-group">
        <label htmlFor="solicitacaoDate">Data</label>
        <input id="solicitacaoDate" name="date" type="date" defaultValue={todayISO()} required />
      </div>

      <div className="form-group">
        <label htmlFor="solicitacaoItemNome">Itens</label>
        <div className="req-custom-item-row">
          <input
            id="solicitacaoItemNome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Rádio comunicador"
          />
          <input
            type="number"
            min="1"
            step="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            style={{ maxWidth: 90 }}
          />
          <button type="button" className="btn-small" onClick={adicionarItem}>
            + Adicionar
          </button>
        </div>
      </div>

      {itens.length > 0 && (
        <div className="req-item-list">
          {itens.map((item, index) => (
            <div key={`${item.nome}-${index}`} className="list-item">
              <div className="info">
                <h4>{item.nome}</h4>
              </div>
              <div className="list-item-actions">
                <span className="pill-count" style={{ marginLeft: 0 }}>
                  {item.quantidade}x
                </span>
                <button type="button" className="btn-small btn-delete" onClick={() => removerItem(index)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="solicitacaoUrgente">
          <input
            id="solicitacaoUrgente"
            type="checkbox"
            checked={urgente}
            onChange={(e) => setUrgente(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Urgente
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="solicitacaoObservacao">Observação</label>
        <input
          id="solicitacaoObservacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="inline-form-buttons">
        <span className="pill-count">
          {itens.length} {itens.length === 1 ? "item adicionado" : "itens adicionados"}
        </span>
        <button className="btn-save" type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar para aprovação"}
        </button>
      </div>
    </form>
  );
}
