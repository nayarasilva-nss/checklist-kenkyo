import { getCurrentUser } from "@/lib/auth/dal";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { canCoverOtherUnits, getCoveringUnit } from "@/lib/auth/covering-unit";
import { getGestorFuncao } from "@/lib/auth/gestor-funcao";
import { resolveRequisicaoScope } from "@/lib/data/requisicoes";
import { tiposPermitidos } from "@/lib/auth/requisicoes";
import { canCreateSolicitacao } from "@/lib/auth/solicitacoes";
import { getFormDefinitions } from "@/lib/data/form-definitions";
import { isPlatformOperator } from "@/lib/data/organizations";
import { getUnits, getJobFunctions } from "@/lib/data/units";
import { logout } from "@/lib/auth/actions";
import { AppNav } from "./AppNav";
import { CoveringUnitBanner } from "./CoveringUnitBanner";
import { GestorFuncaoBanner } from "./GestorFuncaoBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user.organizationStatus === "pending") {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Conta em análise</h1>
          <p>
            Recebemos o cadastro da sua empresa e ele está sendo revisado pela nossa equipe.
            Assim que for aprovado, você já poderá usar o sistema normalmente com este mesmo
            login.
          </p>
          <form action={logout}>
            <button className="btn-login" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  }

  const showCoveringUnitBanner = canCoverOtherUnits(user);
  const isGestor = user.profile === "gestor";
  const showRequisicoes = resolveRequisicaoScope(user) !== null;
  const canCreateRequisicao = tiposPermitidos(user).length > 0;
  const showSolicitacoes = canCreateSolicitacao(user);
  const [covering, units, atuando, jobFunctions, orgFormDefinitions] = await Promise.all([
    showCoveringUnitBanner ? getCoveringUnit() : Promise.resolve(null),
    showCoveringUnitBanner ? getUnits() : Promise.resolve([]),
    isGestor ? getGestorFuncao() : Promise.resolve(null),
    isGestor ? getJobFunctions() : Promise.resolve([]),
    user.organizationId
      ? getFormDefinitions(user.organizationId, { onlyActive: true })
      : Promise.resolve([]),
  ]);
  // Aparece no menu quando a empresa tem pelo menos um formulário
  // personalizado ativo — a própria tela filtra o que essa pessoa pode
  // de fato preencher, mesmo padrão de "Perdas" sempre aparecer no menu.
  const showFormularios = orgFormDefinitions.length > 0;
  const showPlataforma = isPlatformOperator(user);

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
        showFormularios={showFormularios}
        showPlataforma={showPlataforma}
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
