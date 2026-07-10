"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/lib/actions/manage";

type ChecklistOption = { id: number; name: string };

export function AddTaskForm({ checklists }: { checklists: ChecklistOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-add" type="button" onClick={() => setOpen(true)}>
        + Adicionar Tarefa
      </button>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createTask(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setOpen(false);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form className="inline-form" ref={formRef} onSubmit={handleSubmit}>
      <h4>Adicionar Tarefa ao Checklist</h4>
      <div className="form-group">
        <label htmlFor="taskChecklistSelect">Selecione o Checklist</label>
        <select id="taskChecklistSelect" name="checklistTypeId" defaultValue="">
          <option value="" disabled>
            Selecione...
          </option>
          {checklists.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="newTaskName">Nome da Tarefa</label>
        <input
          id="newTaskName"
          name="label"
          placeholder="Ex: Verificar segurança"
        />
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button
          type="button"
          className="btn-cancel"
          onClick={() => setOpen(false)}
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
