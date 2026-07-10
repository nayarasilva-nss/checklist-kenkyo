import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { history, users } from "@/lib/db/schema";

export async function getHistoryEntries(limit = 100) {
  return db
    .select({
      id: history.id,
      action: history.action,
      status: history.status,
      createdAt: history.createdAt,
      userName: users.name,
    })
    .from(history)
    .innerJoin(users, eq(users.id, history.userId))
    .orderBy(desc(history.createdAt))
    .limit(limit);
}
