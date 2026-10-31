"use client";

import { useState } from "react";
import { useTransition } from "react";
import { salvarLigacaoErp, type ActionState } from "@/lib/actions/erp";

/**
 * A ligação com o ERP desta empresa: endereço da API e a chave (o mesmo
 * valor de API_REQUISICOES_TOKEN no ERP). Em branco = empresa sem ERP:
 * o checklist funciona sozinho e as requisições ficam pendentes aqui.
 */
export function LigacaoErpForm({ organizationId, urlAtual }: { organizationId: number; urlAtual?: string | null }) {
  const [estado, setEstado] = useState<ActionState>();
  const [salvando, iniciar] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("organizationId", String(organizationId));
        iniciar(async () => setEstado(await salvarLigacaoErp(undefined, fd)));
      }}
      style={{ display: "grid", gap: 8, marginTop: 10, maxWidth: 520 }}
    >
      <label style={{ display: "grid", gap: 4 }}>
        <span className="fraco">Endereço do ERP (ex.: https://erp.kenkyo.com.br)</span>
        <input name="erp_api_url" defaultValue={urlAtual ?? ""} placeholder="https://…" />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span className="fraco">Chave da API (a mesma do ERP)</span>
        <input name="erp_api_token" type="password" placeholder="cola aqui a chave" />
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn btn-primary" type="submit" disabled={salvando}>Salvar ligação</button>
        {estado?.error && <span className="login-error" style={{ margin: 0 }}>{estado.error}</span>}
        {estado?.ok && <span className="items-count" style={{ margin: 0, color: "var(--success-text)" }}>{estado.ok}</span>}
      </div>
      <span className="fraco">Sem a ligação, os módulos de ERP (Contagem, Caixa, Estoque) ficam de fora do menu.</span>
    </form>
  );
}
