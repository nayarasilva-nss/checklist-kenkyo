"use client";

import { useRef, useState, useTransition } from "react";
import { createFilletingRecord } from "@/lib/actions/filleting";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function FiletagemForm() {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createFilletingRecord(undefined, fd);
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
      <h4>Registrar Filetagem</h4>
      <div className="form-group">
        <label htmlFor="fdate">Data</label>
        <input id="fdate" name="date" type="date" defaultValue={todayISO()} required />
      </div>
      <div className="form-group">
        <label htmlFor="fishType">Pescado</label>
        <input id="fishType" name="fishType" placeholder="Ex: Salmão" required />
      </div>
      <div className="form-group">
        <label htmlFor="recebidoKg">Recebido (kg)</label>
        <input id="recebidoKg" name="recebidoKg" type="number" step="0.01" min="0" required />
      </div>
      <div className="form-group">
        <label htmlFor="fileKg">Filé (kg)</label>
        <input id="fileKg" name="fileKg" type="number" step="0.01" min="0" required />
      </div>
      <div className="form-group">
        <label htmlFor="pontaClaraKg">Ponta Clara (kg)</label>
        <input id="pontaClaraKg" name="pontaClaraKg" type="number" step="0.01" min="0" required />
      </div>
      <div className="form-group">
        <label htmlFor="pontaEscuraKg">Ponta Escura (kg)</label>
        <input id="pontaEscuraKg" name="pontaEscuraKg" type="number" step="0.01" min="0" required />
      </div>
      <div className="form-group">
        <label htmlFor="pelesKg">Peles (kg)</label>
        <input id="pelesKg" name="pelesKg" type="number" step="0.01" min="0" required />
      </div>
      <div className="form-group">
        <label htmlFor="raspasKg">Raspas/Aparas (kg)</label>
        <input id="raspasKg" name="raspasKg" type="number" step="0.01" min="0" required />
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
