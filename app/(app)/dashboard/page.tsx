import { redirect } from "next/navigation";

// O Painel foi fundido com a tela Hoje — mantém a rota viva (bookmarks,
// links antigos) redirecionando pra lá com os mesmos filtros.
export default async function DashboardRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string; date?: string }>;
}) {
  const { unit, date } = await searchParams;
  const params = new URLSearchParams();
  if (unit) params.set("unit", unit);
  if (date) params.set("date", date);
  const qs = params.toString();
  redirect(qs ? `/hoje?${qs}` : "/hoje");
}
