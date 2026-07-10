import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistsForUser, getTemplates } from "@/lib/data/checklists";
import { getUsers } from "@/lib/data/manage";
import { createChecklistFromTemplate } from "@/lib/actions/checklist";
import { ChecklistItemRow } from "./ChecklistItemRow";

const TYPE_LABELS = { daily: "📋 Diários", weekly: "📋 Semanais" } as const;

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType } = await searchParams;
  const type = rawType === "weekly" ? "weekly" : "daily";

  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const viewer = {
    id: user.id,
    profile: user.profile,
    jobFunctionId: user.jobFunctionId,
  };
  const [checklists, templates, users] = await Promise.all([
    getChecklistsForUser(type, viewer),
    isGestor ? getTemplates(viewer) : Promise.resolve([]),
    isGestor ? getUsers() : Promise.resolve([]),
  ]);

  return (
    <>
      <h2>Selecione o Tipo de Checklist</h2>
      <div className="type-selector">
        {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map(
          (t) => (
            <Link
              key={t}
              href={`/checklist?type=${t}`}
              className={`type-btn ${type === t ? "active" : ""}`}
            >
              {TYPE_LABELS[t]}
            </Link>
          ),
        )}
      </div>

      {isGestor && (
        <div style={{ marginBottom: 20 }}>
          <h3>Usar Modelo Pré-definido</h3>
          {templates.length === 0 && (
            <p className="empty-state">
              Nenhum modelo cadastrado ainda. Crie um em Gerenciar &gt;
              Modelos de Checklist.
            </p>
          )}
          <div className="templates-grid">
            {templates.map((template) => {
              const eligibleUsers = template.jobFunctionId
                ? users.filter(
                    (u) => u.jobFunctionId === template.jobFunctionId,
                  )
                : users;

              return (
                <form
                  key={template.id}
                  action={createChecklistFromTemplate}
                  className="template-card"
                >
                  <input
                    type="hidden"
                    name="templateId"
                    value={template.id}
                  />
                  <input type="hidden" name="type" value={type} />
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="items-count">
                    {template.itemCount} tarefas
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label htmlFor={`assignedUser-${template.id}`}>
                      Atribuir a
                    </label>
                    <select
                      id={`assignedUser-${template.id}`}
                      name="assignedUserId"
                      defaultValue=""
                    >
                      <option value="">
                        Todos da função (sem atribuição específica)
                      </option>
                      {eligibleUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-save" style={{ marginTop: 12 }}>
                    Criar Checklist
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}

      {checklists.length === 0 ? (
        <p className="empty-state">
          {isGestor
            ? "Nenhum checklist encontrado"
            : "Nenhum checklist atribuído a você ainda. Peça a um Gestor para criar um checklist para a sua função."}
        </p>
      ) : (
        checklists.map((checklist) => (
          <div key={checklist.id} className="checklist-block">
            <div className="checklist-block-header">
              <div>
                <h3>{checklist.name}</h3>
                <p>{checklist.description}</p>
                {checklist.assignedUserName && (
                  <p className="items-count">
                    Atribuído a: {checklist.assignedUserName}
                  </p>
                )}
              </div>
              <a
                className="btn-pdf"
                href={`/api/checklists/${checklist.id}/export`}
              >
                📥 Enviar PDF
              </a>
            </div>

            {checklist.items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                checklistTypeId={checklist.id}
              />
            ))}
          </div>
        ))
      )}
    </>
  );
}
