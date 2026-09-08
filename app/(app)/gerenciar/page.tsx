import Link from "next/link";
import { requireGestor } from "@/lib/auth/dal";
import {
  getUsers,
  getChecklistTypesWithCounts,
  getUnits,
  getJobFunctions,
} from "@/lib/data/manage";
import { deleteUnit, deleteJobFunction } from "@/lib/actions/manage";
import { getCatalogCategories, getCatalogItems } from "@/lib/data/catalog";
import { AddUserForm } from "./AddUserForm";
import { UserRow } from "./UserRow";
import { AddChecklistTypeForm } from "./AddChecklistTypeForm";
import { ChecklistTypeRow } from "./ChecklistTypeRow";
import { AddUnitForm } from "./AddUnitForm";
import { AddJobFunctionForm } from "./AddJobFunctionForm";
import { DeleteButton } from "./DeleteButton";
import { AddCategoryForm } from "./AddCategoryForm";
import { CategoryRow } from "./CategoryRow";
import { AddCatalogItemForm } from "./AddCatalogItemForm";
import { CatalogItemRow } from "./CatalogItemRow";

const TABS = [
  { key: "usuarios", label: "Usuários" },
  { key: "modelos", label: "Modelos de checklist" },
  { key: "unidades", label: "Unidades" },
  { key: "funcoes", label: "Funções" },
  { key: "catalogo", label: "Catálogo" },
] as const;

export default async function GerenciarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireGestor();

  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab! : "usuarios";

  const [users, checklistTypes, units, jobFunctions, catalogCategories, catalogItems] =
    await Promise.all([
      getUsers(),
      getChecklistTypesWithCounts(),
      getUnits(),
      getJobFunctions(),
      getCatalogCategories(),
      getCatalogItems(),
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
        <div className="board-layout">
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Usuários · {users.length}
            </div>
            {users.map((user) => (
              <UserRow key={user.id} user={user} units={units} jobFunctions={jobFunctions} />
            ))}
          </div>
          <div className="detail-panel" style={{ minHeight: "auto" }}>
            <AddUserForm units={units} jobFunctions={jobFunctions} />
          </div>
        </div>
      )}

      {tab === "modelos" && (
        <div className="board-layout">
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Modelos de Checklist · {checklistTypes.length}
            </div>
            {checklistTypes.map((c) => (
              <ChecklistTypeRow
                key={c.id}
                checklistType={c}
                jobFunctions={jobFunctions}
                users={users}
              />
            ))}
          </div>
          <div className="detail-panel" style={{ minHeight: "auto" }}>
            <AddChecklistTypeForm jobFunctions={jobFunctions} users={users} />
          </div>
        </div>
      )}

      {tab === "unidades" && (
        <div className="board-layout">
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Unidades · {units.length}
            </div>
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
          <div className="detail-panel" style={{ minHeight: "auto" }}>
            <AddUnitForm />
          </div>
        </div>
      )}

      {tab === "funcoes" && (
        <div className="board-layout">
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Funções · {jobFunctions.length}
            </div>
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
          <div className="detail-panel" style={{ minHeight: "auto" }}>
            <AddJobFunctionForm />
          </div>
        </div>
      )}

      {tab === "catalogo" && (
        <div className="board-layout">
          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Categorias · {catalogCategories.length}
            </div>
            {catalogCategories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
          <div className="detail-panel" style={{ minHeight: "auto" }}>
            <AddCategoryForm />
          </div>

          <div className="today-card">
            <div className="today-card-title" style={{ marginBottom: 14 }}>
              Produtos · {catalogItems.length}
            </div>
            {catalogItems.map((item) => (
              <CatalogItemRow key={item.id} item={item} categories={catalogCategories} />
            ))}
          </div>
          <div className="detail-panel" style={{ minHeight: "auto" }}>
            <AddCatalogItemForm categories={catalogCategories} />
          </div>
        </div>
      )}
    </>
  );
}
