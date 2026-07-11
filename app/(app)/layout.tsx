import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

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
          <Link href="/inicio" className="btn-home">
            🏠 Início
          </Link>
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

      <div className="content">
        <div className="tab-content">{children}</div>
      </div>
    </div>
  );
}
