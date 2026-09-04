import { getCurrentUser } from "@/lib/auth/dal";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { AppNav } from "./AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

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
      />
      <div className="app-main">
        <div className="content">
          <div className="tab-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
