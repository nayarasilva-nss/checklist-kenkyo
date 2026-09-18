import { isGestorProfile } from "@/lib/auth/profile";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistExportData } from "@/lib/data/checklists";
import { resolveUnitScope } from "@/lib/data/units";
import { ImprimirButton } from "./ImprimirButton";

const STATUS_LABEL: Record<string, string> = {
  conforme: "Conforme",
  "nao-conforme": "Não conforme",
  "nao-se-aplica": "Não se aplica",
  pending: "Pendente",
};

function formatDate(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function ImprimirChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ checklistTypeId?: string; userId?: string; date?: string; unitId?: string }>;
}) {
  const user = await getCurrentUser();
  const { checklistTypeId: rawTypeId, userId: rawUserId, date, unitId: rawUnitId } =
    await searchParams;

  const checklistTypeId = Number(rawTypeId);
  const userId = Number(rawUserId);
  const unitId = rawUnitId ? Number(rawUnitId) : null;
  if (!checklistTypeId || !userId || !date) notFound();

  // Mesma regra do Histórico: gestor vê tudo, o resto só a própria unidade.
  const allowedUnitId = resolveUnitScope(user, unitId);
  if (!isGestorProfile(user.profile) && allowedUnitId !== unitId) {
    redirect("/historico");
  }

  const data = await getChecklistExportData(checklistTypeId, userId, date, unitId, user.organizationId!);
  if (!data) notFound();

  const total = data.items.length;
  const done = data.items.filter((i) => i.status !== "pending").length;

  return (
    <div className="print-doc">
      <style>{`
        body { background: #ffffff; }
        .print-doc {
          background: #ffffff;
          min-height: 100vh;
          max-width: 760px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          color: #16140f;
          font-family: Arial, Helvetica, sans-serif;
        }
        .print-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .print-head {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 3px solid #e63946;
          padding-bottom: 18px;
          margin-bottom: 24px;
        }
        .print-head h1 {
          font-size: 20px;
          margin: 0 0 4px;
          color: #16140f;
        }
        .print-head .sub {
          font-size: 13px;
          color: #65635a;
        }
        .print-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 6px;
          margin-top: 6px;
          background: #fbe4e6;
          color: #b3261e;
        }
        .print-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 28px;
          margin-bottom: 22px;
          font-size: 13.5px;
        }
        .print-grid .label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #a19f92;
          margin-bottom: 2px;
        }
        .print-grid .value {
          color: #16140f;
        }
        table.print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          margin-bottom: 28px;
        }
        table.print-table th,
        table.print-table td {
          border: 1px solid #e3e1da;
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        table.print-table th {
          background: #16140f;
          color: #fff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .print-footer {
          margin-top: 34px;
          font-size: 11px;
          color: #a19f92;
          text-align: center;
        }
        @page {
          size: A4;
          margin: 16mm 14mm;
        }
        @media print {
          .no-print { display: none !important; }
          .print-doc { padding: 0; max-width: none; }
        }
      `}</style>

      <div className="print-toolbar no-print">
        <Link href="/historico" className="btn-tertiary">
          ← Voltar
        </Link>
        <ImprimirButton />
      </div>

      <div className="print-head">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo pode vir de URL externa configurada por empresa */}
        <img src={user.organizationLogoUrl ?? "/kenkyo-logo.png"} alt={user.organizationName ?? "Kenkyo"} width={52} height={52} />
        <div>
          <h1>{data.checklistType.name}</h1>
          <div className="sub">{user.organizationName ?? "Grupo Kenkyo"} · {data.unitName ?? "—"}</div>
          <span className="print-badge">
            {done}/{total} concluídos
          </span>
        </div>
      </div>

      <div className="print-grid">
        <div>
          <div className="label">Responsável</div>
          <div className="value">{data.userName}</div>
        </div>
        <div>
          <div className="label">Unidade</div>
          <div className="value">{data.unitName ?? "—"}</div>
        </div>
        <div>
          <div className="label">Data</div>
          <div className="value">{formatDate(data.date)}</div>
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Status</th>
            <th>Justificativa</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td>{item.label}</td>
              <td>{STATUS_LABEL[item.status] ?? item.status}</td>
              <td>{item.justification ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-footer">
        Documento gerado pelo sistema {user.organizationName ?? "Kenkyo"} em{" "}
        {new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
