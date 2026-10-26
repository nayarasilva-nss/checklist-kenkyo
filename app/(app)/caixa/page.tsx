import Link from "next/link";
import { redirect } from "next/navigation";
import { canFecharCaixa } from "@/lib/auth/caixa";
import { getCurrentUser } from "@/lib/auth/dal";
import { unidadeDaContagem } from "@/lib/data/contagem";
import { checklistDayForInstant } from "@/lib/date-utils";
import { caixaNoErp, type CaixaDoDia } from "@/lib/erp/caixa";
import { erpConfigurado } from "@/lib/erp/integracao";
import { CaixaForm } from "./CaixaForm";

/**
 * Fechamento de caixa: quem fecha informa o que cada forma de pagamento deu, o dinheiro contado na gaveta e a
 * sangria. Vai direto para o ERP — a sangria entra no cofre na hora, e o financeiro confere no dia seguinte.
 */
export default async function CaixaPage({ searchParams }: { searchParams: Promise<{ unidade?: string; data?: string }> }) {
  const user = await getCurrentUser();
  if (!canFecharCaixa(user)) redirect("/hoje");
  const { unidade: escolhida, data: dataPedida } = await searchParams;
  const { lista, unidade } = await unidadeDaContagem(user, Number(escolhida) || null);
  const hoje = checklistDayForInstant(new Date());
  const data = dataPedida && /^\d{4}-\d{2}-\d{2}$/.test(dataPedida) && dataPedida <= hoje ? dataPedida : hoje;

  let dia: CaixaDoDia | null = null, erro: string | null = null;
  if (!erpConfigurado()) erro = "A ligação com o ERP não está configurada.";
  else if (unidade) {
    try {
      dia = await caixaNoErp(unidade.cnpj, data);
    } catch (e) {
      erro = e instanceof Error ? e.message : "Não foi possível falar com o ERP.";
    }
  }
  const link = (u: number | undefined, d: string) => `/caixa?${u ? `unidade=${u}&` : ""}data=${d}`;

  return (
    <>
      <div className="page-topbar"><h2 style={{ marginBottom: 0 }}>Fechamento de caixa</h2></div>
      {lista.length > 1 && (
        <div className="filter-pills">
          {lista.map((u) => <Link key={u.id} href={link(u.id, data)} className={`pill${u.id === unidade?.id ? " active" : ""}`}>{u.name}</Link>)}
        </div>
      )}
      {!unidade ? (
        <div className="empty-state">Sua unidade ainda não está ligada ao ERP. Quem administra liga em Gerenciar › ERP.</div>
      ) : erro || !dia ? (
        <div className="empty-state">{erro}</div>
      ) : (
        <CaixaForm key={`${unidade.id}-${data}`} unidadeId={unidade.id} data={data} hoje={hoje} dia={dia} />
      )}
    </>
  );
}
