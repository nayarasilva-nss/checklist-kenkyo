"use client";

import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  conforme: "✓ Conforme",
  "nao-conforme": "✗ Não Conforme",
  "nao-se-aplica": "➖ Não se Aplica",
  pending: "○ Pendente",
};

type Item = {
  label: string;
  status: string;
  justification: string | null;
  photoUrl: string | null;
};

export function ChecklistHistoryRow({
  checklistName,
  userName,
  unitName,
  date,
  completedItems,
  totalItems,
  items,
}: {
  checklistName: string;
  userName: string;
  unitName: string | null;
  date: string;
  completedItems: number;
  totalItems: number;
  items: Item[];
}) {
  const [expanded, setExpanded] = useState(false);
  const done = totalItems > 0 && completedItems >= totalItems;

  return (
    <div className="history-item">
      <div className="history-item-header">
        <div>
          <div className="date">{new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR")}</div>
          <div className="title">
            {userName} — {checklistName}
            {unitName ? ` — ${unitName}` : ""}
          </div>
        </div>
        <div className="history-item-actions">
          <span className={`status-pill ${done ? "completed" : "pending"}`}>
            {completedItems}/{totalItems} {done ? "concluído" : "em andamento"}
          </span>
          <button className="btn-small" type="button" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Ocultar" : "Ver detalhes"}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="history-item-details">
          {items.map((item, i) => (
            <div key={i} className="item-text">
              <strong>{item.label}</strong> — {STATUS_LABELS[item.status] ?? item.status}
              {item.justification ? ` — ${item.justification}` : ""}
              {item.photoUrl && (
                <>
                  {" "}
                  <a href={item.photoUrl} target="_blank" rel="noopener noreferrer">
                    Ver foto
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
