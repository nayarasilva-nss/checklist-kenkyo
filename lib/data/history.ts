import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { history, users } from "@/lib/db/schema";

export async function addHistoryEntry(
  userId: number,
  action: string,
  status: "completed" | "pending",
) {
  const [user] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user?.organizationId) return;

  await db.insert(history).values({ organizationId: user.organizationId, userId, action, status });
}
