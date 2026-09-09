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
  checklistTypeId,
  checklistName,
  userId,
  userName,
  unitId,
  unitName,
  date,
  completedItems,
  totalItems,
  items,
}: {
  checklistTypeId: number;
  checklistName: string;
  userId: number;
  userName: string;
  unitId: number | null;
  unitName: string | null;
  date: string;
  completedItems: number;
  totalItems: number;
  items: Item[];
}) {
  const [expanded, setExpanded] = useState(false);
  const done = totalItems > 0 && completedItems >= totalItems;

  const pdfParams = new URLSearchParams({
    checklistTypeId: String(checklistTypeId),
    userId: String(userId),
    date,
  });
  if (unitId !== null) pdfParams.set("unitId", String(unitId));

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
          <a className="btn-small" href={`/historico/imprimir?${pdfParams.toString()}`} target="_blank" rel="noopener noreferrer">
            📥 PDF
          </a>
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
