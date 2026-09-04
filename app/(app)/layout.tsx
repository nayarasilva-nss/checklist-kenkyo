import { getCurrentUser } from "@/lib/auth/dal";
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
      />
      <div className="app-main">
        <div className="content">
          <div className="tab-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
