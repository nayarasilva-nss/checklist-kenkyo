"use client";

import { useRef, useState, useTransition } from "react";
import { createDeliveryErrorRecord } from "@/lib/actions/delivery-errors";
import { todayISO } from "@/lib/date-utils";

export function PedidosErroForm({
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
      const result = await createDeliveryErrorRecord(undefined, fd);
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
      <h4>Registrar Pedidos com Erro</h4>
      {units && units.length > 0 && (
        <div className="form-group">
          <label htmlFor="deUnitId">Unidade</label>
          <select id="deUnitId" name="unitId" required>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="deDate">Data</label>
        <input id="deDate" name="date" type="date" defaultValue={todayISO()} required />
      </div>
      <div className="form-group">
        <label htmlFor="deTotalPedidos">Total de pedidos</label>
        <input id="deTotalPedidos" name="totalPedidos" type="number" step="1" min="1" required />
      </div>
      <div className="form-group">
        <label htmlFor="dePedidosComErro">Pedidos com erro</label>
        <input id="dePedidosComErro" name="pedidosComErro" type="number" step="1" min="0" required />
      </div>
      <div className="form-group">
        <label htmlFor="deMotivo">Motivo (opcional)</label>
        <input id="deMotivo" name="motivo" placeholder="Ex: endereço errado, item faltando" />
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
