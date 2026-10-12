import Link from "next/link";
import { redirect } from "next/navigation";
import { canContar, canEntregarContagem } from "@/lib/auth/contagem";
import { getCurrentUser } from "@/lib/auth/dal";
import { setorDeQuemConta, unidadeDaContagem } from "@/lib/data/contagem";
import { contagemNoErp } from "@/lib/erp/contagens";
import { ContagemForm } from "./ContagemForm";

export default async function ContagemFolhaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ unidade?: string }> }) {
  const user = await getCurrentUser();
  if (!canContar(user)) redirect("/hoje");
  const id = Number((await params).id);
  const { unidade: escolhida } = await searchParams;
  const { unidade } = await unidadeDaContagem(user, Number(escolhida) || null);
  if (!unidade || !Number.isInteger(id)) redirect("/contagem");
  let contagem;
  try {
    contagem = await contagemNoErp(id, unidade.cnpj);
  } catch (e) {
    return (
      <>
        <div className="page-topbar"><h2 style={{ marginBottom: 0 }}>Contagem</h2></div>
        <div className="empty-state">{e instanceof Error ? e.message : "Não foi possível abrir a contagem."} <Link href="/contagem">Voltar</Link></div>
      </>
    );
  }
  const setor = await setorDeQuemConta(user);
  // a folha recomeça a cada gravação: a chave muda com o que o ERP tem contado
  const versao = contagem.itens.map((i) => `${i.linha_id}:${i.qtd_contada ?? ""}`).join("|") + contagem.status;
  return (
    <ContagemForm
      key={hash(versao)}
      unidadeId={unidade.id}
      contagem={contagem}
      setor={setor}
      podeEntregar={canEntregarContagem(user)}
      voltar={`/contagem${escolhida ? `?unidade=${unidade.id}` : ""}`}
    />
  );
}

/** Resumo curto de um texto, para a chave que remonta a folha quando o ERP muda. */
function hash(texto: string): string {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return String(h);
}
