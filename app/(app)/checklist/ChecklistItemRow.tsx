"use client";

import { useState, useTransition } from "react";
import { markConforme, markNaoConforme } from "@/lib/actions/checklist";
import type { CompletionStatus } from "@/lib/data/checklists";

type Item = {
  id: number;
  label: string;
  status: CompletionStatus;
  justification: string | null;
};

export function ChecklistItemRow({
  item,
  checklistTypeId,
}: {
  item: Item;
  checklistTypeId: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [justification, setJustification] = useState(item.justification ?? "");
  const [isPending, startTransition] = useTransition();

  function handleConforme() {
    const fd = new FormData();
    fd.set("itemId", String(item.id));
    fd.set("checklistTypeId", String(checklistTypeId));
    startTransition(async () => {
      await markConforme(fd);
      setShowForm(false);
    });
  }

  function handleNaoConformeClick() {
    setJustification(item.justification ?? "");
    setShowForm(true);
  }

  function handleSubmitJustification(event: React.FormEvent) {
    event.preventDefault();
    if (!justification.trim()) return;
    const fd = new FormData();
    fd.set("itemId", String(item.id));
    fd.set("checklistTypeId", String(checklistTypeId));
    fd.set("justification", justification);
    startTransition(async () => {
      await markNaoConforme(fd);
      setShowForm(false);
    });
  }

  const statusClass =
    item.status === "conforme"
      ? "status-conforme"
      : item.status === "nao-conforme"
        ? "status-nao-conforme"
        : "";

  return (
    <div className={`checklist-item ${statusClass}`}>
      <div className="item-button-row">
        <button
          type="button"
          className={`btn-status btn-status-conforme ${item.status === "conforme" ? "active" : ""}`}
          onClick={handleConforme}
          disabled={isPending}
        >
          ✓ Conforme
        </button>
        <button
          type="button"
          className={`btn-status btn-status-nao-conforme ${item.status === "nao-conforme" ? "active" : ""}`}
          onClick={handleNaoConformeClick}
          disabled={isPending}
        >
          ✗ Não Conforme
        </button>
      </div>

      <span className="item-text">{item.label}</span>

      {showForm && (
        <form className="justification-form" onSubmit={handleSubmitJustification}>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Motivo da não conformidade"
            required
          />
          <div className="justification-form-buttons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button className="btn-save" type="submit" disabled={isPending}>
              Salvar
            </button>
          </div>
        </form>
      )}

      {!showForm && item.status === "nao-conforme" && item.justification && (
        <div className="justification-box">
          <strong>Justificativa:</strong> {item.justification}{" "}
          <button
            type="button"
            className="btn-small"
            onClick={handleNaoConformeClick}
            style={{ marginLeft: 8 }}
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
