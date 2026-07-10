import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decrypt, getSessionCookie, type Profile } from "./session";

export const verifySession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decrypt(token);

  if (!session?.userId) {
    redirect("/login");
  }

  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profile: users.profile,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = rows[0];
  if (!user) {
    redirect("/login");
  }

  return user;
});

export async function requireGestor() {
  const user = await getCurrentUser();
  if (user.profile !== "gestor") {
    redirect("/dashboard");
  }
  return user;
}

export type { Profile };
