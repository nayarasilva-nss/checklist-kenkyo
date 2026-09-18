import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isGestorProfile } from "@/lib/auth/profile";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { decrypt, getSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: Request): Promise<NextResponse> {
  const token = await getSessionCookie();
  const session = await decrypt(token);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Não usa getCurrentUser() aqui — ela faz redirect() em caso de falha,
  // o que não funciona dentro de um Route Handler (sem contexto de
  // renderização de página). Busca direta na tabela em vez disso.
  const [row] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!row?.organizationId) {
    return NextResponse.json({ error: "Seu usuário não está vinculado a uma empresa" }, { status: 400 });
  }
  const orgPrefix = `org-${row.organizationId}/`;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Todo upload tem que estar dentro da pasta da própria empresa —
        // o caminho vem do cliente (ver ChecklistItemRow.tsx,
        // DocumentUploadForm.tsx), mas quem decide se ele é válido é o
        // servidor, com a empresa do usuário autenticado, não a que o
        // cliente disse que é.
        if (!pathname.startsWith(orgPrefix)) {
          throw new Error("Caminho de upload inválido");
        }
        const rest = pathname.slice(orgPrefix.length);

        if (rest.startsWith("documentos/")) {
          if (!isGestorProfile(session.profile)) {
            throw new Error("Apenas o Gestor pode enviar documentos");
          }
          return {
            allowedContentTypes: [
              "application/pdf",
              "image/jpeg",
              "image/png",
              "image/webp",
            ],
            addRandomSuffix: true,
            maximumSizeInBytes: 20 * 1024 * 1024,
          };
        }
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no upload" },
      { status: 400 },
    );
  }
}
