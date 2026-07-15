import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await getCurrentUser();

  const { id } = await params;
  const documentId = Number(id);
  if (!documentId) {
    return new Response("Documento inválido", { status: 400 });
  }

  const [doc] = await db
    .select({ fileUrl: documents.fileUrl })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) {
    return new Response("Documento não encontrado", { status: 404 });
  }

  const blobResponse = await fetch(doc.fileUrl);
  if (!blobResponse.ok) {
    return new Response("Erro ao carregar documento", { status: 502 });
  }

  const contentType = blobResponse.headers.get("content-type") ?? "application/octet-stream";
  const body = await blobResponse.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
    },
  });
}
