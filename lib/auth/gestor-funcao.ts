import "server-only";
import { isGestorProfile } from "@/lib/auth/profile";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { todayISO } from "@/lib/date-utils";

const GESTOR_FUNCAO_COOKIE = "gestor-funcao";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error("AUTH_SECRET is not set");
}
const encodedKey = new TextEncoder().encode(secretKey);

type GestorFuncaoPayload = {
  jobFunctionId: number;
  jobFunctionName: string;
  date: string;
};

async function encryptGestorFuncao(payload: GestorFuncaoPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedKey);
}

async function decryptGestorFuncao(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as GestorFuncaoPayload;
  } catch {
    return null;
  }
}

export async function setGestorFuncao(jobFunctionId: number, jobFunctionName: string) {
  const token = await encryptGestorFuncao({ jobFunctionId, jobFunctionName, date: todayISO() });
  const cookieStore = await cookies();
  cookieStore.set(GESTOR_FUNCAO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearGestorFuncao() {
  const cookieStore = await cookies();
  cookieStore.delete(GESTOR_FUNCAO_COOKIE);
}

/** Only valid for the calendar day it was set. */
export async function getGestorFuncao(): Promise<GestorFuncaoPayload | null> {
  const cookieStore = await cookies();
  const payload = await decryptGestorFuncao(cookieStore.get(GESTOR_FUNCAO_COOKIE)?.value);
  if (!payload || payload.date !== todayISO()) return null;
  return payload;
}

/**
 * Gestor doesn't come with a função assigned — and shouldn't see every
 * checklist by default, only if they opt into operational work for the
 * day by picking one. Everyone else already has a fixed jobFunctionId,
 * unaffected.
 */
export async function resolveEffectiveJobFunctionId(viewer: {
  profile: string;
  jobFunctionId: number | null;
}): Promise<number | null> {
  if (!isGestorProfile(viewer.profile)) return viewer.jobFunctionId;
  const picked = await getGestorFuncao();
  return picked ? picked.jobFunctionId : null;
}
