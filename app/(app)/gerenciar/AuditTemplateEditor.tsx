import {
  addAuditGroup,
  renameAuditGroup,
  deleteAuditGroup,
  addAuditItem,
  updateAuditItem,
  deleteAuditItem,
} from "@/lib/actions/audits";
import { DeleteButton } from "./DeleteButton";

type Group = {
  id: number;
  name: string;
  items: { id: number; label: string; weight: number; howToVerify: string; responsible: string; appliesTo: string }[];
};

export function AuditTemplateEditor({ groups }: { groups: Group[] }) {
  return (
    <div className="board-layout">
      <div className="today-card">
        <div className="today-card-title" style={{ marginBottom: 6 }}>
          Modelo de auditoria · {groups.length} {groups.length === 1 ? "grupo" : "grupos"}
        </div>
        <p className="items-count" style={{ marginBottom: 14 }}>
          Grupos e perguntas usados nas auditorias de unidade. Mudanças valem para as próximas
          auditorias — as já feitas não são alteradas.
        </p>

        {groups.map((group) => (
          <div key={group.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
            <form action={renameAuditGroup} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="hidden" name="id" value={group.id} />
              <input name="name" defaultValue={group.name} aria-label="Nome do grupo" style={{ flex: 1, fontWeight: 600 }} />
              <button className="btn-small" type="submit">Renomear</button>
            </form>
            {group.items.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                <form action={updateAuditItem} style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
                  <input type="hidden" name="id" value={item.id} />
                  <input name="label" defaultValue={item.label} aria-label="Critério" style={{ flex: "1 1 100%" }} />
                  <select name="weight" defaultValue={item.weight} aria-label="Peso">
                    <option value={3}>Crítico (3)</option>
                    <option value={2}>Maior (2)</option>
                    <option value={1}>Menor (1)</option>
                  </select>
                  <input name="responsible" defaultValue={item.responsible} placeholder="Responsável" aria-label="Responsável" style={{ flex: "1 1 120px" }} />
                  <input name="appliesTo" defaultValue={item.appliesTo} placeholder="Aplicável a" aria-label="Aplicável a" style={{ flex: "1 1 120px" }} />
                  <input name="howToVerify" defaultValue={item.howToVerify} placeholder="Como verificar" aria-label="Como verificar" style={{ flex: "1 1 100%" }} />
                  <button className="btn-small" type="submit">Salvar</button>
                </form>
                <DeleteButton action={deleteAuditItem} id={item.id} confirmText="Remover esse critério?" />
              </div>
            ))}
            <form action={addAuditItem} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="hidden" name="groupId" value={group.id} />
              <input name="label" placeholder="Novo critério do grupo" style={{ flex: 1 }} />
              <select name="weight" defaultValue={1} aria-label="Peso">
                <option value={3}>Crítico (3)</option>
                <option value={2}>Maior (2)</option>
                <option value={1}>Menor (1)</option>
              </select>
              <button className="btn-small" type="submit">+ Pergunta</button>
            </form>
            <div style={{ marginTop: 8 }}>
              <DeleteButton
                action={deleteAuditGroup}
                id={group.id}
                confirmText={`Remover o grupo "${group.name}" e todas as perguntas dele?`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="detail-panel" style={{ minHeight: "auto" }}>
        <form action={addAuditGroup} className="inline-form">
          <h4>Novo grupo</h4>
          <div className="form-group">
            <label htmlFor="newAuditGroup">Nome</label>
            <input id="newAuditGroup" name="name" placeholder="Ex: Instalações" />
          </div>
          <div className="inline-form-buttons">
            <button className="btn-save" type="submit">Adicionar grupo</button>
          </div>
        </form>
      </div>
    </div>
  );
}
