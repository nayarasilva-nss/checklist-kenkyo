import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { escalaExcecoes, organizations, units, users } from "@/lib/db/schema";
import { removerExcecaoEscala } from "@/lib/actions/escala";
import { checklistDayISO } from "@/lib/date-utils";
import { DeleteButton } from "./DeleteButton";
import { ExcecaoForm, InicioEscalaForm } from "./EscalaForms";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function dataBr(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} (${dia})`;
}

/** Gerenciar › Escala: início da escala e exceções pontuais (trocas, rodízio, coberturas). */
export async function EscalaPainel({ organizationId }: { organizationId: number }) {
  const hoje = checklistDayISO();
  const [[org], pessoas, excecoes] = await Promise.all([
    db.select({ desde: organizations.escalaVigenteDesde }).from(organizations).where(eq(organizations.id, organizationId)).limit(1),
    db
      .select({ id: users.id, name: users.name, profile: users.profile, unitName: units.name, folgaDias: users.folgaDias })
      .from(users)
      .leftJoin(units, eq(units.id, users.unitId))
      .where(eq(users.organizationId, organizationId))
      .orderBy(asc(users.name)),
    db
      .select({ id: escalaExcecoes.id, date: escalaExcecoes.date, tipo: escalaExcecoes.tipo, name: users.name, unitName: units.name })
      .from(escalaExcecoes)
      .innerJoin(users, eq(users.id, escalaExcecoes.userId))
      .leftJoin(units, eq(units.id, users.unitId))
      .where(and(eq(escalaExcecoes.organizationId, organizationId), gte(escalaExcecoes.date, hoje)))
      .orderBy(asc(escalaExcecoes.date), asc(users.name)),
  ]);
  const escalaveis = pessoas.filter((p) => p.profile === "gerente" || p.profile === "lider");
  const semFolga = escalaveis.filter((p) => p.folgaDias.length === 0).length;

  return (
    <div className="board-layout">
      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 6 }}>Exceções de escala · {excecoes.length}</div>
        <p className="items-count" style={{ marginBottom: 14 }}>
          Folgas fixas ficam em Usuários › Editar. Aqui entram as trocas, o rodízio e as coberturas, de hoje em diante.
          {org?.desde && semFolga > 0 && ` ${semFolga} de ${escalaveis.length} gerentes/líderes ainda sem folga fixa cadastrada.`}
        </p>
        {excecoes.length === 0 ? (
          <p className="items-count">Nenhuma exceção lançada.</p>
        ) : (
          excecoes.map((e) => (
            <div className="list-item" key={e.id}>
              <div className="info">
                <h4>{e.name}</h4>
                <p>
                  {dataBr(e.date)} · {e.tipo === "folga" ? "folga" : "trabalha (era folga fixa)"}
                  {e.unitName ? ` · ${e.unitName}` : ""}
                </p>
              </div>
              <div className="list-item-actions">
                <DeleteButton action={removerExcecaoEscala} id={e.id} confirmText="Remover esta exceção?" />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="detail-panel" style={{ minHeight: "auto", display: "grid", gap: 16 }}>
        <InicioEscalaForm desde={org?.desde ?? null} />
        <ExcecaoForm pessoas={escalaveis.map((p) => ({ id: p.id, name: p.name, unitName: p.unitName }))} />
      </div>
    </div>
  );
}
