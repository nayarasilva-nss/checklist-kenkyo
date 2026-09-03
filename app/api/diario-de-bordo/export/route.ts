import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/dal";
import { getShiftLogsByScope, resolveShiftLogScope } from "@/lib/data/shift-logs";
import { LEADER_SELF_ASSESSMENT, SHIFT_STATUS } from "@/lib/shift-log-constants";

const STATUS_LABELS = Object.fromEntries(SHIFT_STATUS.map((s) => [s.value, s.label]));
const ASSESSMENT_LABELS = Object.fromEntries(
  LEADER_SELF_ASSESSMENT.map((a) => [a.value, a.label]),
);

function formatPendencias(
  pendencias: { descricao: string; responsavel: string | null; prazo: string | null }[],
) {
  return pendencias
    .map((p) => {
      const responsavel = p.responsavel ? ` — ${p.responsavel}` : "";
      const prazo = p.prazo
        ? ` (prazo: ${new Date(`${p.prazo}T00:00:00`).toLocaleDateString("pt-BR")})`
        : "";
      return `${p.descricao}${responsavel}${prazo}`;
    })
    .join("; ");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  const { searchParams } = new URL(request.url);
  const rawUnit = searchParams.get("unit");
  const requestedUnitId = rawUnit ? Number(rawUnit) : null;

  const scope = resolveShiftLogScope(user, requestedUnitId);
  const records = await getShiftLogsByScope(scope);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Diário de Bordo");

  sheet.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Unidade", key: "unitName", width: 28 },
    { header: "Setor", key: "setor", width: 20 },
    { header: "Líder", key: "liderNome", width: 20 },
    { header: "Status do Turno", key: "statusTurno", width: 16 },
    { header: "Justificativa do Status", key: "statusJustificativa", width: 30 },
    { header: "Principal Desvio", key: "desvioDescricao", width: 40 },
    { header: "Impacto do Desvio", key: "desvioImpacto", width: 30 },
    { header: "Causa Raiz", key: "desvioCausaRaiz", width: 30 },
    { header: "Ações de Liderança", key: "acoesLideranca", width: 30 },
    { header: "Descrição da Ação", key: "acaoLiderancaDescricao", width: 30 },
    { header: "Outras Decisões", key: "outrasDecisoes", width: 30 },
    { header: "Gestão da Equipe", key: "gestaoEquipe", width: 30 },
    { header: "Descrição da Gestão", key: "gestaoEquipeDescricao", width: 30 },
    { header: "Pendências", key: "pendencias", width: 50 },
    { header: "Autoavaliação", key: "autoavaliacao", width: 18 },
    { header: "Poderia Melhorar", key: "autoavaliacaoMelhorias", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const record of records) {
    sheet.addRow({
      date: new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR"),
      unitName: record.unitName,
      setor: record.setor,
      liderNome: record.liderNome,
      statusTurno: STATUS_LABELS[record.statusTurno] ?? record.statusTurno,
      statusJustificativa: record.statusJustificativa,
      desvioDescricao: record.desvioDescricao,
      desvioImpacto: record.desvioImpacto ?? "",
      desvioCausaRaiz: record.desvioCausaRaiz ?? "",
      acoesLideranca: record.acoesLideranca.join(", "),
      acaoLiderancaDescricao: record.acaoLiderancaDescricao ?? "",
      outrasDecisoes: record.outrasDecisoes ?? "",
      gestaoEquipe: record.gestaoEquipe.join(", "),
      gestaoEquipeDescricao: record.gestaoEquipeDescricao ?? "",
      pendencias: formatPendencias(record.pendencias),
      autoavaliacao: ASSESSMENT_LABELS[record.autoavaliacao] ?? record.autoavaliacao,
      autoavaliacaoMelhorias: record.autoavaliacaoMelhorias ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="diario-de-bordo-${Date.now()}.xlsx"`,
    },
  });
}
