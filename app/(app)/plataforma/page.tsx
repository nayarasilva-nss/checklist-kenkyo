import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { isPlatformOperator, getAllOrganizationsWithStats } from "@/lib/data/organizations";
import { ApproveButton } from "./ApproveButton";

export default async function PlataformaPage() {
  const user = await getCurrentUser();
  if (!isPlatformOperator(user)) redirect("/hoje");

  const orgs = await getAllOrganizationsWithStats();

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Plataforma</h2>
      </div>
      <p className="items-count" style={{ marginBottom: 16 }}>
        Empresas cadastradas no sistema (via /signup ou criadas direto no banco).
      </p>

      <div className="data-table">
        <div
          className="data-table-head"
          style={{ gridTemplateColumns: "1fr 160px 100px 120px 140px 120px" }}
        >
          <span>Empresa</span>
          <span>Slug</span>
          <span>Status</span>
          <span>Usuários</span>
          <span>Criada em</span>
          <span></span>
        </div>
        {orgs.length === 0 ? (
          <div className="data-table-empty">Nenhuma empresa cadastrada ainda.</div>
        ) : (
          orgs.map((org) => (
            <div
              key={org.id}
              className="data-table-row"
              style={{ gridTemplateColumns: "1fr 160px 100px 120px 140px 120px", cursor: "default" }}
            >
              <span>{org.name}</span>
              <span>{org.slug}</span>
              <span>{org.status === "pending" ? "Pendente" : "Ativa"}</span>
              <span>{org.userCount}</span>
              <span className="data-table-date">
                {new Date(org.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <span>{org.status === "pending" && <ApproveButton organizationId={org.id} />}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
