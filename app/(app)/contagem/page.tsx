import Link from "next/link";
import { redirect } from "next/navigation";
import { canContar } from "@/lib/auth/contagem";
import { getCurrentUser } from "@/lib/auth/dal";
import { unidadeDaContagem } from "@/lib/data/contagem";
import { contagensNoErp, type ContagemDevida, type ContagemResumo } from "@/lib/erp/contagens";
import { erpConfigurado } from "@/lib/erp/integracao";
import { BotaoComecar } from "./BotaoComecar";

const CURVA: Record<string, string> = { A: "itens mais importantes (curva A)", B: "itens da curva B", C: "itens da curva C" };

/**
 * Contagem de estoque: o ERP diz o que está para contar (pela agenda de cada
 * local) e guarda o que foi contado. Às cegas: aqui nunca aparece quanto o
 * sistema acha que tem.
 */
export default async function ContagemPage({ searchParams }: { searchParams: Promise<{ unidade?: string }> }) {
  const user = await getCurrentUser();
  if (!canContar(user)) redirect("/hoje");
  const { unidade: escolhida } = await searchParams;
  const { lista, unidade } = await unidadeDaContagem(user, Number(escolhida) || null);

  let contagens: ContagemResumo[] = [], devidas: ContagemDevida[] = [], erro: string | null = null;
  if (!erpConfigurado()) erro = "A ligação com o ERP não está configurada.";
  else if (unidade) {
    try {
      ({ contagens, devidas } = await contagensNoErp(unidade.cnpj));
    } catch (e) {
      erro = e instanceof Error ? e.message : "Não foi possível falar com o ERP.";
    }
  }
  const sufixo = unidade && lista.length > 1 ? `?unidade=${unidade.id}` : "";

  return (
    <>
      <div className="page-topbar"><h2 style={{ marginBottom: 0 }}>Contagem de estoque</h2></div>
      {lista.length > 1 && (
        <div className="filter-pills">
          {lista.map((u) => <Link key={u.id} href={`/contagem?unidade=${u.id}`} className={`pill${u.id === unidade?.id ? " active" : ""}`}>{u.name}</Link>)}
        </div>
      )}
      {!unidade ? (
        <div className="empty-state">Sua unidade ainda não está ligada ao ERP. Quem administra liga em Gerenciar › ERP.</div>
      ) : erro ? (
        <div className="empty-state">{erro}</div>
      ) : (
        <>
          <p className="items-count" style={{ marginTop: 0 }}>
            Conte o que está no local, item por item. O sistema não mostra quanto deveria ter: é de propósito. Item que não tem, conte 0.
          </p>
          {contagens.length > 0 && (
            <>
              <h3>Em andamento</h3>
              {contagens.map((c) => (
                <Link key={c.id} href={`/contagem/${c.id}${sufixo}`} className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="info">
                    <h4>{c.local}{c.curva ? ` · curva ${c.curva}` : c.escopo === "total" ? " · todos os itens" : ""}</h4>
                    <p>{c.contados} de {c.itens} itens contados</p>
                  </div>
                  <span className={`badge ${c.status === "contada" ? "badge-info" : "badge-warning"}`}>{c.status === "contada" ? "entregue, esperando conferência" : "contando"}</span>
                </Link>
              ))}
            </>
          )}
          <h3>Para fazer</h3>
          {devidas.length === 0 ? (
            <div className="empty-state">Nenhuma contagem pendente pela agenda.</div>
          ) : devidas.map((d) => (
            <div key={d.agenda_id} className="list-item">
              <div className="info">
                <h4>{d.local} · {CURVA[d.curva] ?? d.curva}</h4>
                <p>{d.dias_desde === null ? "Nunca contado" : `Última contagem há ${d.dias_desde} dias`} · de {d.periodicidade_dias} em {d.periodicidade_dias} dias</p>
              </div>
              <div className="list-item-actions"><BotaoComecar unidadeId={unidade.id} agendaId={d.agenda_id} sufixo={sufixo} /></div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
