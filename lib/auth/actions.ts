"use server";

import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, deleteSession } from "./session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuário e senha" };
  }

  // O usuário é comparado sem diferenciar maiúsculas: o teclado do celular
  // põe a primeira letra maiúscula e há logins antigos cadastrados assim.
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = ${username}`)
    .limit(1);

  const user = rows[0];
  // Senha exata primeiro; se falhar e só diferir por espaço no começo ou no
  // fim (o autocompletar do celular costuma acrescentar), tenta sem ele.
  let passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (user && !passwordMatches && password !== password.trim()) {
    passwordMatches = await bcrypt.compare(password.trim(), user.passwordHash);
  }

  if (!user || !passwordMatches) {
    return { error: "Usuário ou senha inválidos" };
  }

  await createSession({ userId: user.id, profile: user.profile });
  redirect("/hoje");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
