"use client";

import { useState } from "react";

type EditablePendencia = { descricao: string; responsavel: string; prazo: string };

export function PendenciasEditor({ name }: { name: string }) {
  const [items, setItems] = useState<EditablePendencia[]>([]);

  function updateItem(index: number, patch: Partial<EditablePendencia>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { descricao: "", responsavel: "", prazo: "" }]);
  }

  return (
    <div className="form-group">
      <label>Pendências em aberto</label>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.map((item, index) => (
        <div className="item-editor-row" key={index}>
          <input
            type="text"
            value={item.descricao}
            onChange={(e) => updateItem(index, { descricao: e.target.value })}
            placeholder="Pendência"
          />
          <input
            type="text"
            value={item.responsavel}
            onChange={(e) => updateItem(index, { responsavel: e.target.value })}
            placeholder="Responsável"
          />
          <input
            type="date"
            value={item.prazo}
            onChange={(e) => updateItem(index, { prazo: e.target.value })}
          />
          <button
            type="button"
            className="btn-small btn-delete"
            onClick={() => removeItem(index)}
          >
            Remover
          </button>
        </div>
      ))}
      <button type="button" className="btn-small" onClick={addItem}>
        + Adicionar pendência
      </button>
    </div>
  );
}
