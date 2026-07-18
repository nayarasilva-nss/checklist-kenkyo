import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

const PROFILE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  gerente: "Gerente",
  lider: "Líder",
  rh: "RH",
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
        <Link href="/inicio" className="logo-section">
          <Image
            src="/kenkyo-logo.png"
            alt="Kenkyo"
            width={40}
            height={40}
            className="logo"
            priority
          />
          <div className="logo-text">Kenkyo</div>
        </Link>
        <div className="header-right">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              {PROFILE_LABELS[user.profile] ?? user.profile}
            </div>
          </div>
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
