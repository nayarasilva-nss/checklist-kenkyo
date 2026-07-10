import { getCurrentUser } from "@/lib/auth/dal";
import { getHistoryEntries } from "@/lib/data/history-list";

const STATUS_LABELS = { completed: "Concluído", pending: "Pendente" } as const;

export default async function HistoricoPage() {
  await getCurrentUser();
  const entries = await getHistoryEntries();

  return (
    <>
      <h2>Histórico de Atividades</h2>
      {entries.length === 0 ? (
        <p className="empty-state">Nenhuma atividade registrada</p>
      ) : (
        entries.map((entry) => (
          <div className="history-item" key={entry.id}>
            <div className="date">
              {entry.createdAt.toLocaleString("pt-BR")}
            </div>
            <div className="title">
              {entry.userName} — {entry.action}
            </div>
            <span className={`status-pill ${entry.status}`}>
              {STATUS_LABELS[entry.status]}
            </span>
          </div>
        ))
      )}
    </>
  );
}
