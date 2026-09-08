import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { canConferirInterna, canConferirExterna, tiposPermitidos } from "@/lib/auth/requisicoes";
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
  const criarTiposPermitidos = tiposPermitidos(user);

  // "gestor-externa" só confere externa (não opera interna de unidade
  // nenhuma) — a aba fica travada, não é uma escolha do usuário.
  const tabs =
    scope.mode === "estoque"
      ? (["interna", "externa"] as const)
      : scope.mode === "gestor-externa"
        ? (["externa"] as const)
        : criarTiposPermitidos;

  const requestedTipo = tipo === "interna" || tipo === "externa" ? tipo : (tabs[0] ?? null);
  const activeTipo = scope.mode === "gestor-externa" ? "externa" : requestedTipo;

  const canConferir = activeTipo === "interna" ? canConferirInterna(user) : canConferirExterna(user);
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
