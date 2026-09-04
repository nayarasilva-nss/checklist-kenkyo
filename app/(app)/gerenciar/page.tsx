import Link from "next/link";
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

const TABS = [
  { key: "usuarios", label: "Usuários" },
  { key: "modelos", label: "Modelos de checklist" },
  { key: "unidades", label: "Unidades" },
  { key: "funcoes", label: "Funções" },
] as const;

export default async function GerenciarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireGestor();

  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : "usuarios";

  const [users, checklistTypes, units, jobFunctions] = await Promise.all([
    getUsers(),
    getChecklistTypesWithCounts(),
    getUnits(),
    getJobFunctions(),
  ]);

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Gerenciar</h2>
      </div>

      <div className="filter-pills">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/gerenciar?tab=${t.key}`}
            className={`pill${tab === t.key ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "usuarios" && (
        <div className="today-card">
          <div className="today-card-title" style={{ marginBottom: 14 }}>
            Usuários
          </div>
          <AddUserForm units={units} jobFunctions={jobFunctions} />
          {users.map((user) => (
            <UserRow key={user.id} user={user} units={units} jobFunctions={jobFunctions} />
          ))}
        </div>
      )}

      {tab === "modelos" && (
        <div className="today-card">
          <div className="today-card-title" style={{ marginBottom: 14 }}>
            Modelos de Checklist
          </div>
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
      )}

      {tab === "unidades" && (
        <div className="today-card">
          <div className="today-card-title" style={{ marginBottom: 14 }}>
            Unidades
          </div>
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
      )}

      {tab === "funcoes" && (
        <div className="today-card">
          <div className="today-card-title" style={{ marginBottom: 14 }}>
            Funções
          </div>
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
      )}
    </>
  );
}
