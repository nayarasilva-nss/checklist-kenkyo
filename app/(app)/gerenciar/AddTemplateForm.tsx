"use client";

import { useRef, useState, useTransition } from "react";
import { createTemplate } from "@/lib/actions/manage";

export function AddTemplateForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn-add" type="button" onClick={() => setOpen(true)}>
        + Criar Modelo
      </button>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createTemplate(undefined, fd);
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
      <h4>Criar Modelo de Checklist</h4>
      <div className="form-group">
        <label htmlFor="templateName">Nome do Modelo</label>
        <input
          id="templateName"
          name="name"
          placeholder="Ex: Abertura Padrão"
        />
      </div>
      <div className="form-group">
        <label htmlFor="templateDesc">Descrição</label>
        <input
          id="templateDesc"
          name="description"
          placeholder="Descrição do modelo"
        />
      </div>
      <div className="form-group">
        <label htmlFor="templateItems">Tarefas (uma por linha)</label>
        <textarea
          id="templateItems"
          name="items"
          style={{ minHeight: 120 }}
          placeholder={"Verificar segurança\nLigar sistemas\nContar caixa"}
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
