import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { canConferirInterna, canConferirExterna, tiposPermitidos } from "@/lib/auth/requisicoes";
import { resolveRequisicaoScope, getRequisicoesByScope } from "@/lib/data/requisicoes";
import { getCatalogCategories, getCatalogItems } from "@/lib/data/catalog";
import { getUnits } from "@/lib/data/units";
import { todayWeekdayBrazil } from "@/lib/date-utils";
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

  const tabs =
    scope.mode === "unit" || scope.mode === "all"
      ? (["interna", "externa"] as const)
      : criarTiposPermitidos;

  const activeTipo = tipo === "interna" || tipo === "externa" ? tipo : (tabs[0] ?? null);

  const canConferir = activeTipo === "interna" ? canConferirInterna(user) : canConferirExterna(user);
  const canCreate = criarTiposPermitidos.length > 0;
  // Quem não tem unidade fixa (Gestor) escolhe a unidade na hora de criar.
  const needsUnitPicker = canCreate && !user.unitId;

  const [records, categorias, catalogItems, units] = await Promise.all([
    getRequisicoesByScope(scope, activeTipo),
    canCreate ? getCatalogCategories() : Promise.resolve([]),
    canCreate ? getCatalogItems() : Promise.resolve([]),
    needsUnitPicker ? getUnits() : Promise.resolve([]),
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
      units={units}
      todayWeekday={todayWeekdayBrazil()}
      criarTiposPermitidos={criarTiposPermitidos}
    />
  );
}
