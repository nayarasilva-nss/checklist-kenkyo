import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistsForUser } from "@/lib/data/checklists";
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
  const checklists = await getChecklistsForUser(type, viewer);

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

      {checklists.length === 0 ? (
        <p className="empty-state">
          {isGestor
            ? "Nenhum modelo cadastrado para esse tipo ainda. Crie um em Gerenciar > Modelos de Checklist."
            : "Nenhum checklist disponível para você ainda. Peça a um Gestor para criar um modelo para a sua função."}
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
