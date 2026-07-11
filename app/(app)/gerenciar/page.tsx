import { requireGestor } from "@/lib/auth/dal";
import {
  getUsers,
  getChecklistTypesWithCounts,
  getUnits,
  getJobFunctions,
} from "@/lib/data/manage";
import { deleteUnit, deleteJobFunction } from "@/lib/actions/manage";
import { AddUserForm } from "./AddUserForm";
import { UserRow } from "./UserRow";
import { AddChecklistTypeForm } from "./AddChecklistTypeForm";
import { ChecklistTypeRow } from "./ChecklistTypeRow";
import { AddUnitForm } from "./AddUnitForm";
import { AddJobFunctionForm } from "./AddJobFunctionForm";
import { DeleteButton } from "./DeleteButton";

export default async function GerenciarPage() {
  await requireGestor();

  const [users, checklistTypes, units, jobFunctions] = await Promise.all([
    getUsers(),
    getChecklistTypesWithCounts(),
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
        <h3>Modelos de Checklist</h3>
        <AddChecklistTypeForm jobFunctions={jobFunctions} users={users} />
        {checklistTypes.map((c) => (
          <ChecklistTypeRow
            key={c.id}
            checklistType={c}
            jobFunctions={jobFunctions}
            users={users}
          />
        ))}
      </div>
    </>
  );
}
