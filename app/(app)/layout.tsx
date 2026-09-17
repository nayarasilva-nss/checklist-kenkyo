import { getCurrentUser } from "@/lib/auth/dal";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { canCoverOtherUnits, getCoveringUnit } from "@/lib/auth/covering-unit";
import { getGestorFuncao } from "@/lib/auth/gestor-funcao";
import { resolveRequisicaoScope } from "@/lib/data/requisicoes";
import { tiposPermitidos } from "@/lib/auth/requisicoes";
import { canCreateSolicitacao } from "@/lib/auth/solicitacoes";
import { getUnits, getJobFunctions } from "@/lib/data/units";
import { AppNav } from "./AppNav";
import { CoveringUnitBanner } from "./CoveringUnitBanner";
import { GestorFuncaoBanner } from "./GestorFuncaoBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const showCoveringUnitBanner = canCoverOtherUnits(user);
  const isGestor = user.profile === "gestor";
  const showRequisicoes = resolveRequisicaoScope(user) !== null;
  const canCreateRequisicao = tiposPermitidos(user).length > 0;
  const showSolicitacoes = canCreateSolicitacao(user);
  const [covering, units, atuando, jobFunctions] = await Promise.all([
    showCoveringUnitBanner ? getCoveringUnit() : Promise.resolve(null),
    showCoveringUnitBanner ? getUnits() : Promise.resolve([]),
    isGestor ? getGestorFuncao() : Promise.resolve(null),
    isGestor ? getJobFunctions() : Promise.resolve([]),
  ]);

  return (
    <div className="app-shell">
      <AppNav
        userName={user.name}
        profile={user.profile}
        jobFunctionName={user.jobFunctionName}
        canCreateAnomaly={user.profile !== "rh"}
        canSubmitFilleting={canSubmitFilleting(user)}
        canSubmitRestoIngesta={canSubmitRestoIngesta(user)}
        canWriteShiftLog={user.profile === "gerente" || user.profile === "lider"}
        showRequisicoes={showRequisicoes}
        canCreateRequisicao={canCreateRequisicao}
        showSolicitacoes={showSolicitacoes}
      />
      <div className="app-main">
        {showCoveringUnitBanner && (
          <CoveringUnitBanner units={units} homeUnitId={user.unitId} covering={covering} />
        )}
        {isGestor && (
          <GestorFuncaoBanner jobFunctions={jobFunctions} atuando={atuando} />
        )}
        <div className="content">
          <div className="tab-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
