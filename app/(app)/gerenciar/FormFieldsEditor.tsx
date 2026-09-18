"use client";

import { useState } from "react";

export type EditableField = {
  label: string;
  type: "number" | "text" | "date" | "boolean" | "select";
  required: boolean;
  decimals: number;
  unit: string;
  options: string;
};

const TYPE_LABELS: Record<EditableField["type"], string> = {
  number: "Número",
  text: "Texto",
  date: "Data",
  boolean: "Sim/Não",
  select: "Lista de opções",
};

function emptyField(): EditableField {
  return { label: "", type: "text", required: false, decimals: 0, unit: "", options: "" };
}

export function FormFieldsEditor({
  name,
  initialFields,
}: {
  name: string;
  initialFields: EditableField[];
}) {
  const [fields, setFields] = useState<EditableField[]>(
    initialFields.length > 0 ? initialFields : [emptyField()],
  );

  function update(index: number, patch: Partial<EditableField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function remove(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function add() {
    setFields((prev) => [...prev, emptyField()]);
  }

  const payload = fields.map((f) => ({
    label: f.label,
    type: f.type,
    required: f.required,
    decimals: f.decimals,
    unit: f.unit,
    options: f.options
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  }));

  return (
    <div className="form-group">
      <label>Campos do formulário</label>
      <input type="hidden" name={name} value={JSON.stringify(payload)} />
      {fields.map((field, index) => (
        <div
          key={index}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <div className="item-editor-row">
            <input
              type="text"
              value={field.label}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder={`Campo ${index + 1} (ex: Temperatura)`}
              style={{ flex: 2 }}
            />
            <select
              value={field.type}
              onChange={(e) => update(index, { type: e.target.value as EditableField["type"] })}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="item-editor-checkbox">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => update(index, { required: e.target.checked })}
              />
              Obrigatório
            </label>
            <button
              type="button"
              className="btn-small btn-delete"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              Remover
            </button>
          </div>

          {field.type === "number" && (
            <div className="item-editor-row" style={{ marginTop: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Casas decimais
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={field.decimals}
                  onChange={(e) => update(index, { decimals: Number(e.target.value) || 0 })}
                  style={{ width: 60, marginLeft: 6 }}
                />
              </label>
              <input
                type="text"
                value={field.unit}
                onChange={(e) => update(index, { unit: e.target.value })}
                placeholder="Unidade (ex: kg, °C)"
                style={{ maxWidth: 160 }}
              />
            </div>
          )}

          {field.type === "select" && (
            <div className="item-editor-row" style={{ marginTop: 6 }}>
              <input
                type="text"
                value={field.options}
                onChange={(e) => update(index, { options: e.target.value })}
                placeholder="Opções separadas por vírgula (ex: Baixo, Médio, Alto)"
                style={{ flex: 1 }}
              />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-small" onClick={add}>
        + Adicionar campo
      </button>
    </div>
  );
}
