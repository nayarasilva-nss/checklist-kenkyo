"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { abrirContagem } from "@/lib/actions/contagens";

export function BotaoComecar({ unidadeId, agendaId, sufixo }: { unidadeId: number; agendaId: number; sufixo: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [abrindo, iniciar] = useTransition();
  return (
    <>
      <button type="button" className="btn-primary" disabled={abrindo} onClick={() => iniciar(async () => {
        const r = await abrirContagem(unidadeId, agendaId);
        if (r.error || !r.id) { setErro(r.error ?? "Não abriu."); return; }
        router.push(`/contagem/${r.id}${sufixo}`);
      })}>{abrindo ? "Abrindo…" : "Começar"}</button>
      {erro && <span className="login-error" style={{ display: "block" }}>{erro}</span>}
    </>
  );
}
