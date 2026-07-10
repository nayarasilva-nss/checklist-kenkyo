import { getCurrentUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { Tabs } from "./Tabs";

const PROFILE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  gerente: "Gerente",
  lider: "Líder",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="app-container">
      <div className="header">
        <h1>🎯 Kenkyo - Checklists</h1>
        <div className="user-info">
          <span>
            {user.name} ({PROFILE_LABELS[user.profile] ?? user.profile})
          </span>
          <form action={logout}>
            <button className="btn-logout" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>

      <Tabs showManage={user.profile === "gestor"} />

      <div className="content">
        <div className="tab-content">{children}</div>
      </div>
    </div>
  );
}
