import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { canCreateSolicitacao, canApproveSolicitacao } from "@/lib/auth/solicitacoes";
import { resolveSolicitacaoScope, getSolicitacoesByScope } from "@/lib/data/solicitacoes";
import { getUnits } from "@/lib/data/units";
import { SolicitacoesBoard } from "./SolicitacoesBoard";

export default async function SolicitacoesPage() {
  const user = await getCurrentUser();
  const scope = resolveSolicitacaoScope(user);
  if (!scope) {
    redirect("/hoje");
  }

  const canCreate = canCreateSolicitacao(user);
  const canApprove = canApproveSolicitacao(user);
  const effectiveUnitId = await resolveEffectiveUnitId(user);
  // Quem não tem unidade fixa hoje (Gestor sem "Unidade de hoje")
  // escolhe a unidade dentro do formulário ao pedir.
  const needsUnitPicker = canCreate && !effectiveUnitId;

  const [records, units] = await Promise.all([
    getSolicitacoesByScope(scope, user.organizationId!),
    needsUnitPicker ? getUnits(user.organizationId!) : Promise.resolve([]),
  ]);

  return (
    <SolicitacoesBoard
      records={records}
      canCreate={canCreate}
      canApprove={canApprove}
      currentUserId={user.id}
      units={units}
    />
  );
}
