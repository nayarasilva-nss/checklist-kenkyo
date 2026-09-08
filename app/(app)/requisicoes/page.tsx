import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { canConferirRequisicao, tiposPermitidos } from "@/lib/auth/requisicoes";
import { resolveRequisicaoScope, getRequisicoesByScope } from "@/lib/data/requisicoes";
import { getCatalogCategories, getCatalogItems } from "@/lib/data/catalog";
import { RequisicoesBoard } from "./RequisicoesBoard";

export default async function RequisicoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const user = await getCurrentUser();
  const scope = resolveRequisicaoScope(user);
  if (!scope) {
    redirect("/hoje");
  }

  const { tipo } = await searchParams;
  const canConferir = canConferirRequisicao(user);
  const criarTiposPermitidos = tiposPermitidos(user);
  const tabs = canConferir ? (["interna", "externa"] as const) : criarTiposPermitidos;

  const activeTipo = tipo === "interna" || tipo === "externa" ? tipo : (tabs[0] ?? null);

  const canCreate = criarTiposPermitidos.length > 0;

  const [records, categorias, catalogItems] = await Promise.all([
    getRequisicoesByScope(scope, activeTipo),
    canCreate ? getCatalogCategories() : Promise.resolve([]),
    canCreate ? getCatalogItems() : Promise.resolve([]),
  ]);

  return (
    <RequisicoesBoard
      records={records}
      tipo={activeTipo}
      tabs={[...tabs]}
      canCreate={canCreate}
      canConferir={canConferir}
      currentUserId={user.id}
      categorias={categorias}
      catalogItems={catalogItems}
      criarTiposPermitidos={criarTiposPermitidos}
    />
  );
}
