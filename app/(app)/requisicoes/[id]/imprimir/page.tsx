import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { canConferirRequisicao } from "@/lib/auth/requisicoes";
import { getRequisicaoWithItens } from "@/lib/data/requisicoes";
import { ImprimirButton } from "./ImprimirButton";

const TIPO_LABEL: Record<string, string> = {
  interna: "Requisição Interna",
  externa: "Requisição Externa",
};

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  conferida: "Conferida",
  cancelada: "Cancelada",
};

function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ImprimirRequisicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) notFound();

  const requisicao = await getRequisicaoWithItens(id);
  if (!requisicao) notFound();

  const podeVer =
    requisicao.requesterId === user.id ||
    canConferirRequisicao(user, requisicao.tipo as "interna" | "externa");
  if (!podeVer) redirect("/requisicoes");

  const conferidoLabel = requisicao.tipo === "interna" ? "saiu" : "entregue";

  return (
    <div className="print-doc">
      <style>{`
        .print-doc {
          max-width: 760px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          color: #16140f;
          font-family: Arial, Helvetica, sans-serif;
        }
        .print-doc .no-print { }
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
        .print-badge.urgente {
          background: #fde8e8;
          color: #b91c1c;
          margin-left: 6px;
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
        .print-obs {
          font-size: 13.5px;
          margin-bottom: 22px;
          padding: 12px 14px;
          background: #f7f6f2;
          border-radius: 8px;
        }
        table.print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 28px;
        }
        table.print-table th,
        table.print-table td {
          border: 1px solid #e3e1da;
          padding: 8px 10px;
          text-align: left;
        }
        table.print-table th {
          background: #16140f;
          color: #fff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        table.print-table td.num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .print-sign {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 50px;
        }
        .print-sign div {
          border-top: 1px solid #16140f;
          padding-top: 6px;
          font-size: 12px;
          color: #65635a;
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
        <Link href="/requisicoes" className="btn-tertiary">
          ← Voltar
        </Link>
        <ImprimirButton />
      </div>

      <div className="print-head">
        <Image src="/kenkyo-logo.png" alt="Kenkyo" width={52} height={52} />
        <div>
          <h1>{TIPO_LABEL[requisicao.tipo] ?? "Requisição"}</h1>
          <div className="sub">Grupo Kenkyo · {requisicao.unitName}</div>
          <span className="print-badge">{STATUS_LABEL[requisicao.status] ?? requisicao.status}</span>
          {requisicao.urgente && <span className="print-badge urgente">Urgente</span>}
        </div>
      </div>

      <div className="print-grid">
        <div>
          <div className="label">Solicitante</div>
          <div className="value">{requisicao.requesterName}</div>
        </div>
        <div>
          <div className="label">Unidade</div>
          <div className="value">{requisicao.unitName}</div>
        </div>
        <div>
          <div className="label">Criada em</div>
          <div className="value">{formatDateTime(requisicao.createdAt)}</div>
        </div>
        <div>
          <div className="label">{requisicao.status === "cancelada" ? "Cancelada em" : "Conferida em"}</div>
          <div className="value">{formatDateTime(requisicao.concluidoEm)}</div>
        </div>
      </div>

      {requisicao.observacao && (
        <div className="print-obs">
          <strong>Observação:</strong> {requisicao.observacao}
        </div>
      )}

      <table className="print-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Unidade</th>
            <th>Qtd. pedida</th>
            <th>Qtd. {conferidoLabel}</th>
          </tr>
        </thead>
        <tbody>
          {requisicao.itens.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.unidadeMedida}</td>
              <td className="num">{item.qtdPedida}</td>
              <td className="num">{item.qtdConferida ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-sign">
        <div>Solicitante — {requisicao.requesterName}</div>
        <div>Conferido por — ________________________</div>
      </div>

      <div className="print-footer">
        Documento gerado pelo sistema Kenkyo em {formatDateTime(new Date())}
      </div>
    </div>
  );
}
