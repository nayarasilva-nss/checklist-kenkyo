"use client";

import Link from "next/link";
import { nomeArquivoChecklist } from "@/lib/pdf/nome-arquivo";

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
}) {
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
          <a className="btn-small" href={`/api/historico/pdf/${nomeArquivoChecklist({ checklist: checklistName, unitName, dia: date })}?${pdfParams.toString()}`} target="_blank" rel="noopener noreferrer">
            📥 PDF
          </a>
          <Link className="btn-small" href={`/historico/detalhe?${pdfParams.toString()}`}>
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}
