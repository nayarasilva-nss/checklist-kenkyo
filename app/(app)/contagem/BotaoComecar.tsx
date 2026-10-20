"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { abrirContagem, abrirContagemTotal } from "@/lib/actions/contagens";

// agendaId: contagem pedida pela agenda. localId: contagem de todos os itens do local.
export function BotaoComecar({ unidadeId, agendaId, localId, sufixo, rotulo }: { unidadeId: number; agendaId?: number; localId?: number; sufixo: string; rotulo?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [abrindo, iniciar] = useTransition();
  return (
    <>
      <button type="button" className="btn-primary" disabled={abrindo} onClick={() => iniciar(async () => {
        if (localId !== undefined && !confirm("Abrir a contagem de TODOS os itens deste local? Só pode haver uma contagem aberta por local.")) return;
        const r = localId !== undefined ? await abrirContagemTotal(unidadeId, localId) : await abrirContagem(unidadeId, agendaId!);
        if (r.error || !r.id) { setErro(r.error ?? "Não abriu."); return; }
        router.push(`/contagem/${r.id}${sufixo}`);
      })}>{abrindo ? "Abrindo…" : (rotulo ?? "Começar")}</button>
      {erro && <span className="login-error" style={{ display: "block" }}>{erro}</span>}
    </>
  );
}
