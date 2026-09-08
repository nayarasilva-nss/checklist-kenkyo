"use client";

import { useState, useTransition } from "react";
import { updateCategory, deleteCategory } from "@/lib/actions/catalog";
import { DeleteButton } from "./DeleteButton";

export function CategoryRow({ category }: { category: { id: number; name: string } }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="list-item">
        <div className="info">
          <h4>{category.name}</h4>
        </div>
        <div className="list-item-actions">
          <button className="btn-small" type="button" onClick={() => setEditing(true)}>
            Editar
          </button>
          <DeleteButton
            action={deleteCategory}
            id={category.id}
            confirmText={`Deletar a categoria "${category.name}"? Os produtos dela ficam sem categoria.`}
          />
        </div>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateCategory(undefined, fd);
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
      <input type="hidden" name="id" value={category.id} />
      <h4>Editar Categoria</h4>
      <div className="form-group">
        <label htmlFor={`editCategoryName-${category.id}`}>Nome</label>
        <input
          id={`editCategoryName-${category.id}`}
          name="name"
          defaultValue={category.name}
        />
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>
          Cancelar
        </button>
        <button className="btn-save" type="submit" disabled={isPending}>
          Salvar
        </button>
      </div>
    </form>
  );
}
