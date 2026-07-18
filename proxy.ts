import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth/session";

const protectedRoutes = ["/inicio", "/dashboard", "/checklist", "/relatorio", "/historico", "/gerenciar", "/filetagem", "/resto-ingesta", "/documentos", "/anomalias", "/diario-de-bordo"];
const gestorOnlyRoutes = ["/gerenciar"];
const rhAllowedRoutes = ["/inicio", "/anomalias", "/diario-de-bordo"];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  const isLoginRoute = path === "/login";

  const token = request.cookies.get("session")?.value;
  const session = await decrypt(token);

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  if (
    gestorOnlyRoutes.some((route) => path.startsWith(route)) &&
    session &&
    session.profile !== "gestor"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    isProtected &&
    session &&
    session.profile === "rh" &&
    !rhAllowedRoutes.some((route) => path.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
