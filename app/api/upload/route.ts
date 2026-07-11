import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { decrypt, getSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request): Promise<NextResponse> {
  const token = await getSessionCookie();
  const session = await decrypt(token);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith("documentos/")) {
          if (session.profile !== "gestor") {
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
