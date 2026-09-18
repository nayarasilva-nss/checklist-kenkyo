"use client";

import { deleteFormSubmission } from "@/lib/actions/form-definitions";
import { DeleteButton } from "../gerenciar/DeleteButton";
import type { FormDefinition } from "@/lib/data/form-definitions";

type Submission = {
  id: number;
  unitId: number | null;
  unitName: string | null;
  userId: number;
  userName: string;
  date: string;
  values: Record<string, unknown>;
  createdAt: Date;
};

function formatDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatValue(value: unknown, field: FormDefinition["fields"][number]) {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "boolean") return value ? "Sim" : "Não";
  if (field.type === "number") {
    const num = Number(value);
    const formatted = field.decimals ? num.toFixed(field.decimals) : String(num);
    return field.unit ? `${formatted} ${field.unit}` : formatted;
  }
  if (field.type === "date") return formatDate(String(value));
  return String(value);
}

export function SubmissionList({
  definition,
  submissions,
  canDelete,
}: {
  definition: FormDefinition;
  submissions: Submission[];
  canDelete: boolean;
}) {
  if (submissions.length === 0) {
    return <div className="data-table-empty">Nenhum registro ainda.</div>;
  }

  return (
    <div>
      {submissions.map((s) => (
        <div className="list-item" key={s.id}>
          <div className="info">
            <h4>
              {formatDate(s.date)} · {s.unitName ?? "—"}
            </h4>
            <p>
              {definition.fields
                .map((field) => `${field.label}: ${formatValue(s.values[field.key], field)}`)
                .join(" · ")}
            </p>
            <p>Registrado por {s.userName}</p>
          </div>
          {canDelete && (
            <div className="list-item-actions">
              <DeleteButton
                action={deleteFormSubmission}
                id={s.id}
                confirmText={`Remover esse registro de ${formatDate(s.date)}?`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
