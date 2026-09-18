import Link from "next/link";
import { isGestorProfile } from "@/lib/auth/profile";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { canSubmitFormDefinition } from "@/lib/auth/form-definitions";
import { getFormDefinitions, getFormSubmissions } from "@/lib/data/form-definitions";
import { getUnits, resolveUnitScope } from "@/lib/data/units";
import { UnitFilter } from "../UnitFilter";
import { FormularioForm } from "./FormularioForm";
import { SubmissionList } from "./SubmissionList";

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; unit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user.organizationId) redirect("/hoje");

  const isGestor = isGestorProfile(user.profile);
  const { form: rawForm, unit: rawUnit } = await searchParams;
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;
  const unitId = resolveUnitScope(user, requestedUnitId);

  const definitions = await getFormDefinitions(user.organizationId, { onlyActive: true });
  if (definitions.length === 0) {
    return (
      <>
        <div className="page-topbar">
          <h2 style={{ marginBottom: 0 }}>Formulários</h2>
        </div>
        <p className="empty-state">
          {isGestor
            ? "Nenhum formulário personalizado criado ainda — crie um em Gerenciar > Formulários."
            : "Nenhum formulário personalizado disponível ainda."}
        </p>
      </>
    );
  }

  const activeId = rawForm && definitions.some((d) => d.id === Number(rawForm))
    ? Number(rawForm)
    : definitions[0].id;
  const activeDef = definitions.find((d) => d.id === activeId)!;

  const canSubmit = canSubmitFormDefinition(user, activeDef);
  const effectiveUnitId = await resolveEffectiveUnitId(user);
  const needsUnitPicker = canSubmit && !effectiveUnitId;

  const [submissions, unitsForPicker] = await Promise.all([
    getFormSubmissions(activeDef.id, user.organizationId, unitId),
    needsUnitPicker ? getUnits(user.organizationId!) : Promise.resolve([]),
  ]);
  const unitsForFilter = isGestor ? await getUnits(user.organizationId!) : [];

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Formulários</h2>
      </div>

      <div className="filter-pills">
        {definitions.map((d) => (
          <Link
            key={d.id}
            href={`/formularios?form=${d.id}${requestedUnitId ? `&unit=${requestedUnitId}` : ""}`}
            className={`pill${activeDef.id === d.id ? " active" : ""}`}
          >
            {d.name}
          </Link>
        ))}
      </div>

      {isGestor && (
        <div style={{ maxWidth: 280, marginBottom: 16 }}>
          <UnitFilter units={unitsForFilter} value={requestedUnitId} />
        </div>
      )}

      {activeDef.description && <p className="items-count" style={{ marginBottom: 16 }}>{activeDef.description}</p>}

      {canSubmit && (
        <div className="today-card" style={{ marginBottom: 20 }}>
          <FormularioForm definition={activeDef} units={needsUnitPicker ? unitsForPicker : []} />
        </div>
      )}

      <SubmissionList definition={activeDef} submissions={submissions} canDelete={isGestor} />
    </>
  );
}
