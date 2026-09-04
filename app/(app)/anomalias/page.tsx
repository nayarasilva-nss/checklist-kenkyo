import { getCurrentUser } from "@/lib/auth/dal";
import {
  getAnomaliesByScope,
  resolveAnomalyScope,
} from "@/lib/data/anomalies";
import { getUnits } from "@/lib/data/units";
import { daysAgoISO } from "@/lib/date-utils";
import { AnomaliasBoard } from "./AnomaliasBoard";

export default async function AnomaliasPage({
  searchParams,
}: {
  searchParams: Promise<{
    unit?: string;
    tipo?: string;
    setor?: string;
    dias?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const isRh = user.profile === "rh";
  const canViewAllUnits = isGestor || isRh;
  const { unit: rawUnit, tipo, setor, dias } = await searchParams;
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;

  const scope = resolveAnomalyScope(user, requestedUnitId);

  const sinceDate = dias ? daysAgoISO(Number(dias)) : null;

  const [records, units] = await Promise.all([
    getAnomaliesByScope(scope, { tipo, setor, sinceDate }),
    canViewAllUnits ? getUnits() : Promise.resolve([]),
  ]);

  return (
    <AnomaliasBoard
      records={records}
      units={units}
      canViewAllUnits={canViewAllUnits}
      requestedUnitId={requestedUnitId}
      tipo={tipo ?? null}
      setor={setor ?? null}
      dias={dias ?? null}
      canCreate={!isRh}
      canDelete={isGestor}
      defaultRelator={user.name}
    />
  );
}
