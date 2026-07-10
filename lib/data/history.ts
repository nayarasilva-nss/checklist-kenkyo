import "server-only";
import { db } from "@/lib/db";
import { history } from "@/lib/db/schema";

export async function addHistoryEntry(
  userId: number,
  action: string,
  status: "completed" | "pending",
) {
  await db.insert(history).values({ userId, action, status });
}
