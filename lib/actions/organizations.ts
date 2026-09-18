"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";

export type SignupState = { error?: string } | undefined;

function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "empresa"
  );
}

/** Onboarding: cria uma empresa nova (organizations) + o primeiro
 * usuário, sempre gestor — sem nenhum dado do Kenkyo junto, ao
 * contrário do que os scripts de seed fazem hoje pro Kenkyo em si. */
export async function signupOrganization(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!companyName || !name || !username || !password) {
    return { error: "Preencha todos os campos" };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres" };
  }

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existingUser.length > 0) {
    return { error: "Esse login já está em uso" };
  }

  let slug = slugify(companyName);
  const existingSlug = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (existingSlug.length > 0) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const [org] = await db
    .insert(organizations)
    .values({ name: companyName, slug })
    .returning({ id: organizations.id });

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({
      organizationId: org.id,
      name,
      username,
      passwordHash,
      profile: "gestor",
    })
    .returning({ id: users.id });

  await createSession({ userId: user.id, profile: "gestor" });
  redirect("/hoje");
}
