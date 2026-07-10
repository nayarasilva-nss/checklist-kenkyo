"use client";

import { useRef, useState, useTransition } from "react";
import { createChecklistType } from "@/lib/actions/manage";

export function AddChecklistTypeForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-add" type="button" onClick={() => setOpen(true)}>
        + Adicionar Tipo
      </button>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createChecklistType(undefined, fd);
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
      <h4>Adicionar Tipo de Checklist</h4>
      <div className="form-group">
        <label htmlFor="newChecklistName">Nome</label>
        <input
          id="newChecklistName"
          name="name"
          placeholder="Ex: Abertura da Loja"
        />
      </div>
      <div className="form-group">
        <label htmlFor="newChecklistDesc">Descrição</label>
        <input
          id="newChecklistDesc"
          name="description"
          placeholder="Descrição do checklist"
        />
      </div>
      <div className="form-group">
        <label htmlFor="newChecklistType">Tipo</label>
        <select id="newChecklistType" name="type" defaultValue="daily">
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
        </select>
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
