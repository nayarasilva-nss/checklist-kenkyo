import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistForUser } from "@/lib/data/checklists";
import { ChecklistItemRow } from "../ChecklistItemRow";

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const checklistTypeId = Number(id);

  const user = await getCurrentUser();
  const viewer = {
    id: user.id,
    profile: user.profile,
    jobFunctionId: user.jobFunctionId,
  };

  const checklist = checklistTypeId
    ? await getChecklistForUser(checklistTypeId, viewer)
    : null;

  if (!checklist) notFound();

  return (
    <>
      <Link
        href={`/checklist?type=${checklist.type}`}
        className="btn-cancel"
        style={{ display: "inline-block", marginBottom: 20 }}
      >
        ← Voltar
      </Link>

      <div className="checklist-block-header">
        <div>
          <h2>{checklist.name}</h2>
          {checklist.description && <p>{checklist.description}</p>}
          {checklist.assignedUserName && (
            <p className="items-count">
              Atribuído a: {checklist.assignedUserName}
            </p>
          )}
        </div>
        <a className="btn-pdf" href={`/api/checklists/${checklist.id}/export`}>
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
    </>
  );
}
