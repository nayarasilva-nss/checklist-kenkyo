import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { formDefinitions, formSubmissions, units, users } from "@/lib/db/schema";

export type FormFieldType = "number" | "text" | "date" | "boolean" | "select";

export type FormField = {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  // "number" only — casas decimais (0 = inteiro).
  decimals?: number;
  // "number" only — ex: "kg", "un".
  unit?: string;
  // "select" only.
  options?: string[];
};

export type FormDefinition = {
  id: number;
  organizationId: number;
  name: string;
  description: string;
  fields: FormField[];
  allowedJobFunctionNames: string[];
  allowGestor: boolean;
  active: boolean;
  createdAt: Date;
};

const FIELD_TYPES: FormFieldType[] = ["number", "text", "date", "boolean", "select"];

export function isValidFieldType(v: unknown): v is FormFieldType {
  return typeof v === "string" && (FIELD_TYPES as string[]).includes(v);
}

/** Chave estável do campo, derivada do rótulo na hora da criação — usada
 * como chave em form_submissions.values. Não muda se o rótulo for
 * editado depois (ver updateFormDefinition), pra não invalidar
 * submissões já salvas. */
export function slugifyFieldKey(label: string, existing: Set<string>) {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "campo";
  let key = base;
  let i = 2;
  while (existing.has(key)) {
    key = `${base}_${i}`;
    i++;
  }
  existing.add(key);
  return key;
}

export async function getFormDefinitions(organizationId: number, opts?: { onlyActive?: boolean }) {
  const conditions = [eq(formDefinitions.organizationId, organizationId)];
  if (opts?.onlyActive) conditions.push(eq(formDefinitions.active, true));

  const rows = await db
    .select()
    .from(formDefinitions)
    .where(and(...conditions))
    .orderBy(asc(formDefinitions.id));

  return rows as unknown as FormDefinition[];
}

export async function getFormDefinition(id: number, organizationId: number) {
  const [row] = await db
    .select()
    .from(formDefinitions)
    .where(and(eq(formDefinitions.id, id), eq(formDefinitions.organizationId, organizationId)))
    .limit(1);
  return (row as unknown as FormDefinition) ?? null;
}

export async function getFormSubmissions(formDefinitionId: number, organizationId: number, unitId: number | null) {
  const conditions = [
    eq(formSubmissions.formDefinitionId, formDefinitionId),
    eq(formSubmissions.organizationId, organizationId),
  ];
  if (unitId !== null) conditions.push(eq(formSubmissions.unitId, unitId));

  const rows = await db
    .select({
      id: formSubmissions.id,
      unitId: formSubmissions.unitId,
      unitName: units.name,
      userId: formSubmissions.userId,
      userName: users.name,
      date: formSubmissions.date,
      values: formSubmissions.values,
      createdAt: formSubmissions.createdAt,
    })
    .from(formSubmissions)
    .innerJoin(users, eq(users.id, formSubmissions.userId))
    .leftJoin(units, eq(units.id, formSubmissions.unitId))
    .where(and(...conditions))
    .orderBy(desc(formSubmissions.date), desc(formSubmissions.id))
    .limit(200);

  return rows as (Omit<(typeof rows)[number], "values"> & { values: Record<string, unknown> })[];
}
