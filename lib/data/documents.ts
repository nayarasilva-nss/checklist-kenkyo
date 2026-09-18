import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function getDocuments(organizationId: number) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      category: documents.category,
      subcategory: documents.subcategory,
      fileUrl: documents.fileUrl,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.organizationId, organizationId))
    .orderBy(desc(documents.createdAt));
}
