"use client";

import { useRef, useState, useTransition } from "react";
import { createUtensilBreakageRecord } from "@/lib/actions/utensil-breakage";
import { todayISO } from "@/lib/date-utils";

export function QuebraUtensiliosForm({
  units,
}: {
  // Só não-vazio pra quem não tem unidade fixa — hoje, Gestor — que por
  // isso precisa escolher pra qual unidade é o registro.
  units?: { id: number; name: string }[];
} = {}) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createUtensilBreakageRecord(undefined, fd);
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
      <h4>Registrar Quebra de Utensílio</h4>
      {units && units.length > 0 && (
        <div className="form-group">
          <label htmlFor="ubUnitId">Unidade</label>
          <select id="ubUnitId" name="unitId" required>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="ubDate">Data</label>
        <input id="ubDate" name="date" type="date" defaultValue={todayISO()} required />
      </div>
      <div className="form-group">
        <label htmlFor="ubItem">Item</label>
        <input id="ubItem" name="item" placeholder="Ex: Copo long drink" required />
      </div>
      <div className="form-group">
        <label htmlFor="ubQuantidade">Quantidade</label>
        <input id="ubQuantidade" name="quantidade" type="number" step="1" min="1" required />
      </div>
      <div className="form-group">
        <label htmlFor="ubMotivo">Motivo (opcional)</label>
        <input id="ubMotivo" name="motivo" placeholder="Ex: caiu durante o serviço" />
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button className="btn-save" type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
