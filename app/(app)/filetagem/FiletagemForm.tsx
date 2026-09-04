"use client";

import { useRef, useState, useTransition } from "react";
import { createFilletingRecord } from "@/lib/actions/filleting";
import { todayISO } from "@/lib/date-utils";

type NumericField =
  | "recebidoKg"
  | "fileKg"
  | "pontaClaraKg"
  | "pontaEscuraKg"
  | "pelesKg"
  | "raspasKg";

export function FiletagemForm({
  defaultResponsavel,
}: {
  defaultResponsavel: string;
}) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<NumericField, string>>({
    recebidoKg: "",
    fileKg: "",
    pontaClaraKg: "",
    pontaEscuraKg: "",
    pelesKg: "",
    raspasKg: "",
  });

  const recebido = Number(values.recebidoKg) || 0;
  const aproveitado =
    (Number(values.fileKg) || 0) +
    (Number(values.pontaClaraKg) || 0) +
    (Number(values.pontaEscuraKg) || 0) +
    (Number(values.pelesKg) || 0) +
    (Number(values.raspasKg) || 0);
  const perdaKg = recebido - aproveitado;
  const perdaPercent = recebido > 0 ? (perdaKg / recebido) * 100 : 0;
  const showPreview = values.recebidoKg !== "";

  function handleNumericChange(field: NumericField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

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
        setValues({
          recebidoKg: "",
          fileKg: "",
          pontaClaraKg: "",
          pontaEscuraKg: "",
          pelesKg: "",
          raspasKg: "",
        });
      }
    });
  }

  return (
    <form className="inline-form" ref={formRef} onSubmit={handleSubmit}>
      <h4>Registrar Filetagem</h4>
      <div className="form-row-inline">
        <div className="form-group">
          <label htmlFor="fdate">Data</label>
          <input id="fdate" name="date" type="date" defaultValue={todayISO()} required />
        </div>
        <div className="form-group">
          <label htmlFor="responsavel">Responsável</label>
          <input
            id="responsavel"
            name="responsavel"
            defaultValue={defaultResponsavel}
            placeholder="Nome do responsável"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="fishType">Pescado</label>
          <input id="fishType" name="fishType" placeholder="Ex: Salmão" required />
        </div>
      </div>

      <div className="form-row-inline">
        <div className="form-group">
          <label htmlFor="recebidoKg">Recebido (kg)</label>
          <input
            id="recebidoKg"
            name="recebidoKg"
            type="number"
            step="0.01"
            min="0"
            value={values.recebidoKg}
            onChange={(e) => handleNumericChange("recebidoKg", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="fileKg">Filé (kg)</label>
          <input
            id="fileKg"
            name="fileKg"
            type="number"
            step="0.01"
            min="0"
            value={values.fileKg}
            onChange={(e) => handleNumericChange("fileKg", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="pontaClaraKg">Ponta Clara (kg)</label>
          <input
            id="pontaClaraKg"
            name="pontaClaraKg"
            type="number"
            step="0.01"
            min="0"
            value={values.pontaClaraKg}
            onChange={(e) => handleNumericChange("pontaClaraKg", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row-inline">
        <div className="form-group">
          <label htmlFor="pontaEscuraKg">Ponta Escura (kg)</label>
          <input
            id="pontaEscuraKg"
            name="pontaEscuraKg"
            type="number"
            step="0.01"
            min="0"
            value={values.pontaEscuraKg}
            onChange={(e) => handleNumericChange("pontaEscuraKg", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="pelesKg">Peles (kg)</label>
          <input
            id="pelesKg"
            name="pelesKg"
            type="number"
            step="0.01"
            min="0"
            value={values.pelesKg}
            onChange={(e) => handleNumericChange("pelesKg", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="raspasKg">Raspas/Aparas (kg)</label>
          <input
            id="raspasKg"
            name="raspasKg"
            type="number"
            step="0.01"
            min="0"
            value={values.raspasKg}
            onChange={(e) => handleNumericChange("raspasKg", e.target.value)}
            required
          />
        </div>
      </div>

      {showPreview && (
        <div className="loss-preview">
          Perda calculada: <strong>{perdaKg.toFixed(2)} kg</strong> · {perdaPercent.toFixed(1)}%
        </div>
      )}

      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button className="btn-save" type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Lançar"}
        </button>
      </div>
    </form>
  );
}
