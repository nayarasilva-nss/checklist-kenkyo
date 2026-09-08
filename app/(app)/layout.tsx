import { getCurrentUser } from "@/lib/auth/dal";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { canCoverOtherUnits, getCoveringUnit } from "@/lib/auth/covering-unit";
import { resolveRequisicaoScope } from "@/lib/data/requisicoes";
import { getUnits } from "@/lib/data/units";
import { AppNav } from "./AppNav";
import { CoveringUnitBanner } from "./CoveringUnitBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const showCoveringUnitBanner = canCoverOtherUnits(user);
  const showRequisicoes = resolveRequisicaoScope(user) !== null;
  const [covering, units] = showCoveringUnitBanner
    ? await Promise.all([getCoveringUnit(), getUnits()])
    : [null, []];

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
      />
      <div className="app-main">
        {showCoveringUnitBanner && (
          <CoveringUnitBanner units={units} homeUnitId={user.unitId} covering={covering} />
        )}
        <div className="content">
          <div className="tab-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
