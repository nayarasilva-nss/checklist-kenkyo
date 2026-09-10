import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { canConferirInterna, canConferirExterna, tiposPermitidos } from "@/lib/auth/requisicoes";
import {
  resolveRequisicaoScope,
  getRequisicoesByScope,
  getTodayRequisicoesForLink,
} from "@/lib/data/requisicoes";
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
  const effectiveUnitId = await resolveEffectiveUnitId(user);
  const scope = resolveRequisicaoScope({ ...user, unitId: effectiveUnitId });
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
  const needsUnitPicker = canCreate && !effectiveUnitId;

  const [records, categorias, catalogItems, units, linkCandidatesInterna, linkCandidatesExterna] =
    await Promise.all([
      getRequisicoesByScope(scope, activeTipo),
      canCreate ? getCatalogCategories() : Promise.resolve([]),
      canCreate ? getCatalogItems() : Promise.resolve([]),
      needsUnitPicker ? getUnits() : Promise.resolve([]),
      // Candidatas a "requisição original" pro seletor de excedente —
      // só dá pra saber a unidade de antemão quando ela já é fixa/efetiva
      // hoje (needsUnitPicker=true, ex: Gestor sem "Unidade de hoje",
      // escolhe a unidade só depois de abrir o formulário).
      canCreate && effectiveUnitId && criarTiposPermitidos.includes("interna")
        ? getTodayRequisicoesForLink(effectiveUnitId, "interna")
        : Promise.resolve([]),
      canCreate && effectiveUnitId && criarTiposPermitidos.includes("externa")
        ? getTodayRequisicoesForLink(effectiveUnitId, "externa")
        : Promise.resolve([]),
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
      linkCandidates={{ interna: linkCandidatesInterna, externa: linkCandidatesExterna }}
    />
  );
}
