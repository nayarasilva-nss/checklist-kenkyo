import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";

const TILES = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/checklist", icon: "✓", label: "Checklist" },
  { href: "/relatorio", icon: "📈", label: "Relatório" },
  { href: "/historico", icon: "📋", label: "Histórico" },
  { href: "/filetagem", icon: "🐟", label: "Filetagem" },
  { href: "/resto-ingesta", icon: "🍽️", label: "Resto Ingesta" },
] as const;

export default async function InicioPage() {
  const user = await getCurrentUser();

  const tiles =
    user.profile === "gestor"
      ? [...TILES, { href: "/gerenciar", icon: "⚙️", label: "Gerenciar" }]
      : TILES;

  return (
    <>
      <h2>Início</h2>
      <div className="home-grid">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="home-tile">
            <span className="home-tile-icon">{tile.icon}</span>
            <span className="home-tile-label">{tile.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
