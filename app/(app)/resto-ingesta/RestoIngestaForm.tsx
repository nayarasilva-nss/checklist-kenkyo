"use client";

import { useRef, useState, useTransition } from "react";
import { createRestoIngestaRecord } from "@/lib/actions/resto-ingesta";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RestoIngestaForm() {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createRestoIngestaRecord(undefined, fd);
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
      <h4>Registrar Resto Ingesta</h4>
      <div className="form-group">
        <label htmlFor="ridate">Data</label>
        <input id="ridate" name="date" type="date" defaultValue={todayISO()} required />
      </div>
      <div className="form-group">
        <label htmlFor="experienciasVendidas">Experiências Vendidas</label>
        <input
          id="experienciasVendidas"
          name="experienciasVendidas"
          type="number"
          step="1"
          min="0"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="desperdicioKg">Desperdício (kg)</label>
        <input
          id="desperdicioKg"
          name="desperdicioKg"
          type="number"
          step="0.01"
          min="0"
          required
        />
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
