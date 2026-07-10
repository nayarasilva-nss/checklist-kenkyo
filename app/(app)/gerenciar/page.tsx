import { requireGestor } from "@/lib/auth/dal";
import {
  getUsers,
  getChecklistTypesWithCounts,
  getTemplatesWithCounts,
  getChecklistTypeItemsGrouped,
} from "@/lib/data/manage";
import { deleteChecklistType, deleteTemplate } from "@/lib/actions/manage";
import { AddUserForm } from "./AddUserForm";
import { UserRow } from "./UserRow";
import { AddChecklistTypeForm } from "./AddChecklistTypeForm";
import { AddTaskForm } from "./AddTaskForm";
import { AddTemplateForm } from "./AddTemplateForm";
import { DeleteButton } from "./DeleteButton";

const TYPE_LABELS = { daily: "Diário", weekly: "Semanal" } as const;

export default async function GerenciarPage() {
  await requireGestor();

  const [users, checklistTypes, templates, checklistsWithItems] =
    await Promise.all([
      getUsers(),
      getChecklistTypesWithCounts(),
      getTemplatesWithCounts(),
      getChecklistTypeItemsGrouped(),
    ]);

  return (
    <>
      <h2>Gerenciar Sistema</h2>

      <div className="manage-section">
        <h3>Usuários</h3>
        <AddUserForm />
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>

      <div className="manage-section">
        <h3>Tipos de Checklists</h3>
        <AddChecklistTypeForm />
        {checklistTypes.map((c) => (
          <div className="list-item" key={c.id}>
            <div className="info">
              <h4>{c.name}</h4>
              <p>
                {c.itemCount} itens • {TYPE_LABELS[c.type]}
              </p>
            </div>
            <div className="list-item-actions">
              <DeleteButton
                action={deleteChecklistType}
                id={c.id}
                confirmText={`Deletar o checklist "${c.name}"?`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="manage-section">
        <h3>Tarefas do Checklist</h3>
        <AddTaskForm
          checklists={checklistTypes.map((c) => ({ id: c.id, name: c.name }))}
        />
        {checklistsWithItems
          .filter((c) => c.items.length > 0)
          .map((c) => (
            <div className="list-item" key={c.id}>
              <div className="info">
                <h4>{c.name}</h4>
                <p>{c.items.map((i) => i.label).join(", ")}</p>
              </div>
            </div>
          ))}
      </div>

      <div className="manage-section">
        <h3>Modelos de Checklist</h3>
        <AddTemplateForm />
        {templates.map((t) => (
          <div className="list-item" key={t.id}>
            <div className="info">
              <h4>{t.name}</h4>
              <p>{t.itemCount} tarefas</p>
            </div>
            <div className="list-item-actions">
              <DeleteButton
                action={deleteTemplate}
                id={t.id}
                confirmText={`Deletar o modelo "${t.name}"?`}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
