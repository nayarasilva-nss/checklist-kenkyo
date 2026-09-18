"use client";

import { useRef, useState, useTransition } from "react";
import { createFormSubmission } from "@/lib/actions/form-definitions";
import { todayISO } from "@/lib/date-utils";
import type { FormDefinition } from "@/lib/data/form-definitions";

export function FormularioForm({
  definition,
  units,
}: {
  definition: FormDefinition;
  // Só não-vazio pra quem não tem unidade fixa — hoje, Gestor — que por
  // isso precisa escolher pra qual unidade é o registro.
  units?: { id: number; name: string }[];
}) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    fd.set("formDefinitionId", String(definition.id));
    startTransition(async () => {
      const result = await createFormSubmission(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form className="inline-form" ref={formRef} onSubmit={handleSubmit}>
      <h4>Registrar — {definition.name}</h4>

      {units && units.length > 0 && (
        <div className="form-group">
          <label htmlFor="fdUnitId">Unidade</label>
          <select id="fdUnitId" name="unitId" required>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="fdDate">Data</label>
        <input id="fdDate" name="date" type="date" defaultValue={todayISO()} required />
      </div>

      {definition.fields.map((field) => {
        const id = `fd_${definition.id}_${field.key}`;
        const name = `field_${field.key}`;
        if (field.type === "boolean") {
          return (
            <div className="form-group" key={field.key}>
              <label htmlFor={id}>
                <input id={id} type="checkbox" name={name} style={{ marginRight: 6 }} />
                {field.label}
              </label>
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div className="form-group" key={field.key}>
              <label htmlFor={id}>{field.label}</label>
              <select id={id} name={name} required={field.required} defaultValue="">
                <option value="" disabled>
                  Selecione...
                </option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "number") {
          return (
            <div className="form-group" key={field.key}>
              <label htmlFor={id}>
                {field.label}
                {field.unit ? ` (${field.unit})` : ""}
              </label>
              <input
                id={id}
                name={name}
                type="number"
                step={field.decimals ? 1 / 10 ** field.decimals : 1}
                min="0"
                required={field.required}
              />
            </div>
          );
        }
        if (field.type === "date") {
          return (
            <div className="form-group" key={field.key}>
              <label htmlFor={id}>{field.label}</label>
              <input id={id} name={name} type="date" required={field.required} />
            </div>
          );
        }
        return (
          <div className="form-group" key={field.key}>
            <label htmlFor={id}>{field.label}</label>
            <input id={id} name={name} type="text" required={field.required} />
          </div>
        );
      })}

      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button className="btn-save" type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
