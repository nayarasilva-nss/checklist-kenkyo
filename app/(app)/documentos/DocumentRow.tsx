"use client";

import { useState, useTransition } from "react";
import { deleteDocument, updateDocument } from "@/lib/actions/documents";
import { FICHA_TECNICA_CATEGORY_ORDER } from "@/lib/domain/ficha-tecnica-categorias";
import { DeleteButton } from "../gerenciar/DeleteButton";

type Doc = {
  id: number;
  title: string;
  category: string;
  subcategory: string | null;
};

export function DocumentRow({ doc }: { doc: Doc }) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(doc.category);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="report-item">
        <a href={`/api/documentos/${doc.id}/view`} target="_blank" rel="noopener noreferrer">
          {doc.title}
        </a>
        <div className="report-item-actions">
          <button className="btn-small" type="button" onClick={() => setEditing(true)}>
            Editar
          </button>
          <DeleteButton
            action={deleteDocument}
            id={doc.id}
            confirmText={`Remover "${doc.title}"?`}
          />
        </div>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateDocument(undefined, fd);
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
      <input type="hidden" name="id" value={doc.id} />
      <h4>Editar Documento</h4>
      <div className="form-group">
        <label htmlFor={`editDocTitle-${doc.id}`}>Título</label>
        <input id={`editDocTitle-${doc.id}`} name="title" defaultValue={doc.title} />
      </div>
      <div className="form-group">
        <label htmlFor={`editDocCategory-${doc.id}`}>Categoria</label>
        <select
          id={`editDocCategory-${doc.id}`}
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="ficha_tecnica">Ficha Técnica</option>
          <option value="pop">POP</option>
        </select>
      </div>
      {category === "ficha_tecnica" && (
        <div className="form-group">
          <label htmlFor={`editDocSubcategory-${doc.id}`}>Subcategoria</label>
          <select
            id={`editDocSubcategory-${doc.id}`}
            name="subcategory"
            defaultValue={doc.subcategory ?? ""}
          >
            <option value="">Sem subcategoria (aparece em &quot;Outras&quot;)</option>
            {FICHA_TECNICA_CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}
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
