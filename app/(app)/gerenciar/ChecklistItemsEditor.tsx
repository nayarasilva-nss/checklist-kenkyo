"use client";

import { useState } from "react";

export type EditableItem = { label: string; requiresPhoto: boolean };

export function ChecklistItemsEditor({
  name,
  initialItems,
}: {
  name: string;
  initialItems: EditableItem[];
}) {
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ label: "", requiresPhoto: false }],
  );

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { label: "", requiresPhoto: false }]);
  }

  return (
    <div className="form-group">
      <label>Tarefas</label>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.map((item, index) => (
        <div className="item-editor-row" key={index}>
          <input
            type="text"
            value={item.label}
            onChange={(e) => updateItem(index, { label: e.target.value })}
            placeholder={`Tarefa ${index + 1}`}
          />
          <label className="item-editor-checkbox">
            <input
              type="checkbox"
              checked={item.requiresPhoto}
              onChange={(e) =>
                updateItem(index, { requiresPhoto: e.target.checked })
              }
            />
            Requer foto
          </label>
          <button
            type="button"
            className="btn-small btn-delete"
            onClick={() => removeItem(index)}
            disabled={items.length === 1}
          >
            Remover
          </button>
        </div>
      ))}
      <button type="button" className="btn-small" onClick={addItem}>
        + Adicionar tarefa
      </button>
    </div>
  );
}
