"use client";

import { useRef, useState, useTransition } from "react";
import { createAnomaly } from "@/lib/actions/anomalies";
import { ANOMALY_SETORES, ANOMALY_TYPES } from "@/lib/anomaly-constants";
import { todayISO } from "@/lib/date-utils";

export function AnomaliaForm({ defaultRelator }: { defaultRelator: string }) {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAnomaly(undefined, fd);
      if (result?.error) {
        setError(result.error);
        setSuccess(false);
      } else {
        setError(undefined);
        setSuccess(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form className="inline-form" ref={formRef} onSubmit={handleSubmit}>
      <h4>Registrar Anomalia</h4>

      <div className="form-group">
        <label htmlFor="aDate">Data do ocorrido</label>
        <input id="aDate" name="date" type="date" defaultValue={todayISO()} required />
      </div>

      <div className="form-group">
        <label htmlFor="relator">Quem está relatando a anomalia?</label>
        <input
          id="relator"
          name="relator"
          defaultValue={defaultRelator}
          placeholder="Nome de quem relata"
          required
        />
      </div>

      <div className="form-group">
        <label>Qual o tipo de anomalia?</label>
        {ANOMALY_TYPES.map((tipo) => (
          <div className="item-editor-row item-editor-checkbox" key={tipo}>
            <input type="checkbox" name="tipos" value={tipo} id={`tipo-${tipo}`} />
            <label htmlFor={`tipo-${tipo}`}>{tipo}</label>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label>Quais os setores envolvidos?</label>
        {ANOMALY_SETORES.map((setor) => (
          <div className="item-editor-row item-editor-checkbox" key={setor}>
            <input type="checkbox" name="setores" value={setor} id={`setor-${setor}`} />
            <label htmlFor={`setor-${setor}`}>{setor}</label>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label htmlFor="colaboradoresEnvolvidos">
          Quem são os colaboradores envolvidos na ocorrência?
        </label>
        <input id="colaboradoresEnvolvidos" name="colaboradoresEnvolvidos" required />
      </div>

      <div className="form-group">
        <label htmlFor="oQueAconteceu">O que aconteceu?</label>
        <textarea
          id="oQueAconteceu"
          name="oQueAconteceu"
          placeholder="Descreva da forma mais detalhada o que aconteceu, com quem aconteceu, etc."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="causaPercebida">
          Na sua percepção, o que pode ter causado essa anomalia?
        </label>
        <input id="causaPercebida" name="causaPercebida" placeholder="Ex: erro na produção, desperdício..." required />
      </div>

      <div className="form-group">
        <label htmlFor="consequenciaImediata">Houve consequência imediata?</label>
        <textarea id="consequenciaImediata" name="consequenciaImediata" />
      </div>

      <div className="form-group">
        <label htmlFor="acaoTomada">
          Alguma ação foi tomada no momento para corrigir o problema? Qual?
        </label>
        <input id="acaoTomada" name="acaoTomada" />
      </div>

      <div className="form-group">
        <label htmlFor="sugestaoTratativa">
          Quer deixar uma sugestão de tratativa, caso volte a acontecer?
        </label>
        <input id="sugestaoTratativa" name="sugestaoTratativa" />
      </div>

      {error && <p className="login-error">{error}</p>}
      {success && !error && <p className="empty-state">Anomalia registrada com sucesso.</p>}

      <div className="inline-form-buttons">
        <button className="btn-save" type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
