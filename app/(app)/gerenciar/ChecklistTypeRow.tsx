"use client";

import { useState, useTransition } from "react";
import { updateChecklistType, deleteChecklistType } from "@/lib/actions/manage";
import { DeleteButton } from "./DeleteButton";
import { ChecklistItemsEditor, type EditableItem } from "./ChecklistItemsEditor";

const TYPE_LABELS = { daily: "Diário", weekly: "Semanal" } as const;

type Option = { id: number; name: string };

type ChecklistType = {
  id: number;
  name: string;
  description: string;
  type: "daily" | "weekly";
  items: EditableItem[];
  itemCount: number;
  jobFunctionId: number | null;
  jobFunctionName: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
};

export function ChecklistTypeRow({
  checklistType,
  jobFunctions,
  users,
}: {
  checklistType: ChecklistType;
  jobFunctions: Option[];
  users: Option[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="list-item">
        <div className="info">
          <h4>{checklistType.name}</h4>
          <p>
            {checklistType.itemCount} tarefas • {TYPE_LABELS[checklistType.type]} •{" "}
            {checklistType.jobFunctionName ?? "Todas as funções"}
            {checklistType.assignedUserName
              ? ` • Atribuído a: ${checklistType.assignedUserName}`
              : ""}
          </p>
        </div>
        <div className="list-item-actions">
          <button
            className="btn-small"
            type="button"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
          <DeleteButton
            action={deleteChecklistType}
            id={checklistType.id}
            confirmText={`Deletar o modelo "${checklistType.name}"?`}
          />
        </div>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateChecklistType(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setEditing(false);
      }
    });
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={checklistType.id} />
      <h4>Editar Modelo de Checklist</h4>
      <div className="form-group">
        <label htmlFor={`editChecklistName-${checklistType.id}`}>Nome</label>
        <input
          id={`editChecklistName-${checklistType.id}`}
          name="name"
          defaultValue={checklistType.name}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`editChecklistDesc-${checklistType.id}`}>
          Descrição
        </label>
        <input
          id={`editChecklistDesc-${checklistType.id}`}
          name="description"
          defaultValue={checklistType.description}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`editChecklistType-${checklistType.id}`}>Tipo</label>
        <select
          id={`editChecklistType-${checklistType.id}`}
          name="type"
          defaultValue={checklistType.type}
        >
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={`editChecklistJobFunction-${checklistType.id}`}>
          Função (opcional)
        </label>
        <select
          id={`editChecklistJobFunction-${checklistType.id}`}
          name="jobFunctionId"
          defaultValue={checklistType.jobFunctionId ?? ""}
        >
          <option value="">Todas as funções</option>
          {jobFunctions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={`editChecklistAssignedUser-${checklistType.id}`}>
          Atribuir a (opcional)
        </label>
        <select
          id={`editChecklistAssignedUser-${checklistType.id}`}
          name="assignedUserId"
          defaultValue={checklistType.assignedUserId ?? ""}
        >
          <option value="">Todos da função</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <ChecklistItemsEditor name="itemsJson" initialItems={checklistType.items} />
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button
          type="button"
          className="btn-cancel"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </button>
        <button className="btn-save" type="submit" disabled={isPending}>
          Salvar
        </button>
      </div>
    </form>
  );
}
