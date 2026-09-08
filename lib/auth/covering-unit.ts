import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { todayISO } from "@/lib/date-utils";

const COVERING_UNIT_COOKIE = "covering-unit";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error("AUTH_SECRET is not set");
}
const encodedKey = new TextEncoder().encode(secretKey);

type CoveringUnitPayload = {
  unitId: number;
  unitName: string;
  date: string;
};

/**
 * Gerente/chefe can cover a shift at another unit — e.g. Geovana covering
 * Carla's vacation in Goianésia — and need their checklist/anomalia/
 * filetagem/resto-ingesta/diário de bordo entries that day to count
 * toward that unit instead of their own. Líder is deliberately excluded.
 */
export function canCoverOtherUnits(viewer: {
  profile: string;
  jobFunctionName: string | null;
}) {
  return viewer.profile === "gerente" || (viewer.jobFunctionName?.startsWith("Chefe") ?? false);
}

async function encryptCoveringUnit(payload: CoveringUnitPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedKey);
}

async function decryptCoveringUnit(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as CoveringUnitPayload;
  } catch {
    return null;
  }
}

export async function setCoveringUnit(unitId: number, unitName: string) {
  const token = await encryptCoveringUnit({ unitId, unitName, date: todayISO() });
  const cookieStore = await cookies();
  cookieStore.set(COVERING_UNIT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearCoveringUnit() {
  const cookieStore = await cookies();
  cookieStore.delete(COVERING_UNIT_COOKIE);
}

/** Only valid for the calendar day it was set — reading it tomorrow returns null. */
export async function getCoveringUnit(): Promise<CoveringUnitPayload | null> {
  const cookieStore = await cookies();
  const payload = await decryptCoveringUnit(cookieStore.get(COVERING_UNIT_COOKIE)?.value);
  if (!payload || payload.date !== todayISO()) return null;
  return payload;
}

/**
 * The unit a write action should attribute to — the covering unit if the
 * viewer set one today and is actually allowed to (checked here, not just
 * trusted from the cookie), otherwise their own unit.
 */
export async function resolveEffectiveUnitId(viewer: {
  unitId: number | null;
  profile: string;
  jobFunctionName: string | null;
}): Promise<number | null> {
  if (!canCoverOtherUnits(viewer)) return viewer.unitId;
  const covering = await getCoveringUnit();
  return covering ? covering.unitId : viewer.unitId;
}
