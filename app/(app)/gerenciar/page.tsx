import { requireGestor } from "@/lib/auth/dal";
import {
  getUsers,
  getChecklistTypesWithCounts,
  getTemplatesWithCounts,
  getChecklistTypeItemsGrouped,
  getUnits,
  getJobFunctions,
} from "@/lib/data/manage";
import {
  deleteChecklistType,
  deleteTemplate,
  deleteUnit,
  deleteJobFunction,
} from "@/lib/actions/manage";
import { AddUserForm } from "./AddUserForm";
import { UserRow } from "./UserRow";
import { AddChecklistTypeForm } from "./AddChecklistTypeForm";
import { AddTaskForm } from "./AddTaskForm";
import { AddTemplateForm } from "./AddTemplateForm";
import { AddUnitForm } from "./AddUnitForm";
import { AddJobFunctionForm } from "./AddJobFunctionForm";
import { DeleteButton } from "./DeleteButton";

const TYPE_LABELS = { daily: "Diário", weekly: "Semanal" } as const;

export default async function GerenciarPage() {
  await requireGestor();

  const [
    users,
    checklistTypes,
    templates,
    checklistsWithItems,
    units,
    jobFunctions,
  ] = await Promise.all([
    getUsers(),
    getChecklistTypesWithCounts(),
    getTemplatesWithCounts(),
    getChecklistTypeItemsGrouped(),
    getUnits(),
    getJobFunctions(),
  ]);

  return (
    <>
      <h2>Gerenciar Sistema</h2>

      <div className="manage-section">
        <h3>Unidades</h3>
        <AddUnitForm />
        {units.map((unit) => (
          <div className="list-item" key={unit.id}>
            <div className="info">
              <h4>{unit.name}</h4>
            </div>
            <div className="list-item-actions">
              <DeleteButton
                action={deleteUnit}
                id={unit.id}
                confirmText={`Deletar a unidade "${unit.name}"?`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="manage-section">
        <h3>Funções</h3>
        <AddJobFunctionForm />
        {jobFunctions.map((jobFunction) => (
          <div className="list-item" key={jobFunction.id}>
            <div className="info">
              <h4>{jobFunction.name}</h4>
            </div>
            <div className="list-item-actions">
              <DeleteButton
                action={deleteJobFunction}
                id={jobFunction.id}
                confirmText={`Deletar a função "${jobFunction.name}"?`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="manage-section">
        <h3>Usuários</h3>
        <AddUserForm units={units} jobFunctions={jobFunctions} />
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            units={units}
            jobFunctions={jobFunctions}
          />
        ))}
      </div>

      <div className="manage-section">
        <h3>Tipos de Checklists</h3>
        <AddChecklistTypeForm jobFunctions={jobFunctions} />
        {checklistTypes.map((c) => (
          <div className="list-item" key={c.id}>
            <div className="info">
              <h4>{c.name}</h4>
              <p>
                {c.itemCount} itens • {TYPE_LABELS[c.type]} •{" "}
                {c.jobFunctionName ?? "Todas as funções"}
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
        <AddTemplateForm jobFunctions={jobFunctions} />
        {templates.map((t) => (
          <div className="list-item" key={t.id}>
            <div className="info">
              <h4>{t.name}</h4>
              <p>
                {t.itemCount} tarefas •{" "}
                {t.jobFunctionName ?? "Sem função definida"}
              </p>
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
