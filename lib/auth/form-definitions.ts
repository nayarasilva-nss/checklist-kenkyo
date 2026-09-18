import "server-only";

type Viewer = { profile: string; jobFunctionName: string | null };
type FormDef = { allowedJobFunctionNames: string[]; allowGestor: boolean };

/** Quem pode preencher um formulário personalizado — configurado por
 * definição (não hardcoded por módulo, ao contrário de filetagem/resto
 * ingesta/etc.). Gestor sempre pode criar/editar a definição em si; se
 * também pode *preencher*, é o campo allowGestor que decide. */
export function canSubmitFormDefinition(viewer: Viewer, def: FormDef) {
  if (viewer.profile === "gestor") return def.allowGestor;
  return viewer.jobFunctionName !== null && def.allowedJobFunctionNames.includes(viewer.jobFunctionName);
}
