import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogItems, jobFunctions, requisicoes, units } from "@/lib/db/schema";
import { reenviarRequisicaoErp } from "@/lib/actions/erp";
import { erpConfigurado, lerCatalogoErp, type ErpCatalogo } from "@/lib/erp/integracao";
import { EnviarAntigas, EspelharCatalogo, ProdutosErp, SetoresFuncoes, TentarPendentes, UnidadesErp } from "./ErpLigacao";

const SITUACAO: Record<string, [string, string]> = {
  pendente: ["pendente", "pending"],
  aguardando: ["aguardando ligação", "pending"],
  erro: ["erro", "pending"],
  enviada: ["no ERP", "completed"],
};

/**
 * Gerenciar › ERP: a ligação que leva cada requisição ao ERP em todas as
 * fases (lançada, conferida = baixa de estoque, cancelada). Unidades,
 * produtos e a fila do que não foi.
 */
export async function ErpPainel({ organizationId }: { organizationId: number }) {
  if (!erpConfigurado()) {
    return (
      <div className="today-card">
        <div className="today-card-title">Ligação com o ERP</div>
        <p className="items-count">A ligação ainda não está configurada neste servidor: faltam as variáveis ERP_API_URL e ERP_API_TOKEN. Enquanto isso, as requisições ficam guardadas como pendentes e vão ao ERP quando a ligação existir.</p>
      </div>
    );
  }

  let catalogo: ErpCatalogo | null = null;
  let erroCatalogo: string | null = null;
  try {
    catalogo = await lerCatalogoErp();
  } catch (e) {
    erroCatalogo = e instanceof Error ? e.message : "Não foi possível ler o ERP.";
  }

  const [unidades, produtos, fila, enviadas, antigas, funcoes] = await Promise.all([
    db.select({ id: units.id, name: units.name, erpCnpj: units.erpCnpj, erpLocalInternoId: units.erpLocalInternoId, erpLocalExternoId: units.erpLocalExternoId })
      .from(units).where(eq(units.organizationId, organizationId)).orderBy(units.name),
    db.select({ id: catalogItems.id, name: catalogItems.name, unitMeasure: catalogItems.unitMeasure, erpItemCodigo: catalogItems.erpItemCodigo, erpFator: catalogItems.erpFator })
      .from(catalogItems).where(and(eq(catalogItems.organizationId, organizationId), eq(catalogItems.ativo, true))).orderBy(catalogItems.name),
    db.select({ id: requisicoes.id, tipo: requisicoes.tipo, status: requisicoes.status, unidade: units.name, concluidoEm: requisicoes.concluidoEm, erpStatus: requisicoes.erpStatus, erpMensagem: requisicoes.erpMensagem })
      .from(requisicoes).innerJoin(units, eq(units.id, requisicoes.unitId))
      .where(and(eq(requisicoes.organizationId, organizationId), inArray(requisicoes.erpStatus, ["pendente", "aguardando", "erro"])))
      .orderBy(requisicoes.concluidoEm).limit(100),
    db.select({ id: requisicoes.id, tipo: requisicoes.tipo, unidade: units.name, erpNumero: requisicoes.erpNumero, erpEnviadoEm: requisicoes.erpEnviadoEm, erpMensagem: requisicoes.erpMensagem })
      .from(requisicoes).innerJoin(units, eq(units.id, requisicoes.unitId))
      .where(and(eq(requisicoes.organizationId, organizationId), eq(requisicoes.erpStatus, "enviada")))
      .orderBy(desc(requisicoes.erpEnviadoEm)).limit(10),
    db.select({ n: sql<number>`count(*)::int` }).from(requisicoes)
      .where(and(eq(requisicoes.organizationId, organizationId), eq(requisicoes.status, "conferida"), eq(requisicoes.erpStatus, "nao_enviada"))),
    db.select({ id: jobFunctions.id, name: jobFunctions.name, erpSetor: jobFunctions.erpSetor })
      .from(jobFunctions).where(eq(jobFunctions.organizationId, organizationId)).orderBy(jobFunctions.name),
  ]);
  const quando = (d: Date | null) => (d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 6 }}>Ligação com o ERP</div>
        <p className="items-count" style={{ marginBottom: 0 }}>
          A requisição aparece no ERP assim que é lançada e acompanha a fase daqui: quando o líder confere, o ERP dá a baixa do que saiu no estoque; cancelada aqui, é cancelada lá. Para isso cada unidade precisa estar ligada à empresa dela no ERP, e cada produto do catálogo ao item do ERP. Nada aqui espera o ERP: o que não for na hora fica na fila abaixo.
        </p>
        {erroCatalogo && <p className="login-error" style={{ marginTop: 10 }}>{erroCatalogo}</p>}
      </div>

      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 10 }}>Fila do ERP · {fila.length}</div>
        {fila.length === 0 ? <p className="items-count">Nada parado: toda requisição já está no ERP na fase em que está aqui.</p> : (
          <>
            <table className="ranking-table">
              <thead><tr><th>Requisição</th><th>Fase</th><th>Situação</th><th>O que falta</th><th></th></tr></thead>
              <tbody>{fila.map((r) => (
                <tr key={r.id}>
                  <td><strong>#{r.id}</strong> {r.tipo} · {r.unidade}</td>
                  <td>{r.status}{r.concluidoEm ? ` · ${quando(r.concluidoEm)}` : ""}</td>
                  <td><span className={`status-pill ${SITUACAO[r.erpStatus]?.[1] ?? "pending"}`}>{SITUACAO[r.erpStatus]?.[0] ?? r.erpStatus}</span></td>
                  <td style={{ maxWidth: 420 }}>{r.erpMensagem ?? "—"}</td>
                  <td><form action={reenviarRequisicaoErp}><input type="hidden" name="id" value={r.id} /><button className="btn-small" type="submit">Reenviar</button></form></td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 10 }}><TentarPendentes /></div>
          </>
        )}
        {antigas[0]!.n > 0 && <div style={{ marginTop: 14 }}><EnviarAntigas quantas={antigas[0]!.n} /></div>}
        {enviadas.length > 0 && (
          <details style={{ marginTop: 14 }}>
            <summary className="items-count" style={{ cursor: "pointer" }}>Últimas enviadas</summary>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {enviadas.map((r) => <li key={r.id} className="items-count">#{r.id} {r.tipo} · {r.unidade} → {r.erpNumero ?? "nada a baixar"} em {quando(r.erpEnviadoEm)}{r.erpMensagem ? ` · ${r.erpMensagem}` : ""}</li>)}
            </ul>
          </details>
        )}
      </div>

      {catalogo && (
        <>
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 10 }}>Unidades</div>
            <UnidadesErp unidades={unidades} empresas={catalogo.unidades} locais={catalogo.locais} />
          </div>
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 6 }}>Catálogo igual ao do ERP</div>
            <EspelharCatalogo />
          </div>
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 10 }}>Setor de cada função</div>
            <SetoresFuncoes funcoes={funcoes} setores={catalogo.setores ?? []} />
          </div>
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 10 }}>Produtos do catálogo</div>
            <ProdutosErp produtos={produtos} itens={catalogo.itens} />
          </div>
        </>
      )}
    </div>
  );
}
