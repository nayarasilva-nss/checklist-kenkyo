import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function getDocuments() {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      category: documents.category,
      fileUrl: documents.fileUrl,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .orderBy(desc(documents.createdAt));
}
