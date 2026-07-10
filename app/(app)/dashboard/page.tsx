import { getCurrentUser } from "@/lib/auth/dal";
import { getDashboardStats, getRanking } from "@/lib/data/dashboard";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function DashboardPage() {
  await getCurrentUser();
  const [stats, ranking] = await Promise.all([
    getDashboardStats(),
    getRanking(),
  ]);

  return (
    <>
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="card">
          <h3>Checklists Totais</h3>
          <div className="value">{stats.totalChecklists}</div>
          <div className="subtitle">cadastrados</div>
        </div>
        <div className="card">
          <h3>Concluídos Hoje</h3>
          <div className="value">{stats.completedToday}</div>
          <div className="subtitle">de {stats.totalChecklists}</div>
        </div>
        <div className="card">
          <h3>Em Andamento</h3>
          <div className="value">{stats.inProgress}</div>
          <div className="subtitle">pendentes</div>
        </div>
        <div className="card">
          <h3>Taxa de Conformidade</h3>
          <div className="value">
            {stats.complianceRate === null ? "-" : `${stats.complianceRate}%`}
          </div>
          <div className="subtitle">mês atual</div>
        </div>
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 20 }}>
        🏆 Ranking de Colaboradores
      </h2>
      {ranking.length === 0 ? (
        <p className="empty-state">Nenhum checklist concluído ainda</p>
      ) : (
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Colaborador</th>
              <th>Checklists Completos</th>
              <th>Taxa de Conformidade</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, idx) => (
              <tr key={row.name}>
                <td>
                  {MEDALS[idx] ?? "•"} {idx + 1}º
                </td>
                <td>{row.name}</td>
                <td>{row.completions}</td>
                <td>{row.complianceRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
