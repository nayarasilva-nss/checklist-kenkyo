import ExcelJS from "exceljs";
import { requireGestor } from "@/lib/auth/dal";
import { getAnomalies } from "@/lib/data/anomalies";

export async function GET(request: Request) {
  await requireGestor();

  const { searchParams } = new URL(request.url);
  const rawUnit = searchParams.get("unit");
  const unitId = rawUnit ? Number(rawUnit) : null;

  const records = await getAnomalies(unitId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Anomalias");

  sheet.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Unidade", key: "unitName", width: 28 },
    { header: "Relator", key: "relator", width: 20 },
    { header: "Tipos", key: "tipos", width: 30 },
    { header: "Setores", key: "setores", width: 30 },
    { header: "Colaboradores Envolvidos", key: "colaboradoresEnvolvidos", width: 30 },
    { header: "O que aconteceu", key: "oQueAconteceu", width: 50 },
    { header: "Causa percebida", key: "causaPercebida", width: 30 },
    { header: "Consequência imediata", key: "consequenciaImediata", width: 30 },
    { header: "Ação tomada", key: "acaoTomada", width: 30 },
    { header: "Sugestão de tratativa", key: "sugestaoTratativa", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const record of records) {
    sheet.addRow({
      date: new Date(`${record.date}T00:00:00`).toLocaleDateString("pt-BR"),
      unitName: record.unitName,
      relator: record.relator,
      tipos: record.tipos.join(", "),
      setores: record.setores.join(", "),
      colaboradoresEnvolvidos: record.colaboradoresEnvolvidos,
      oQueAconteceu: record.oQueAconteceu,
      causaPercebida: record.causaPercebida,
      consequenciaImediata: record.consequenciaImediata ?? "",
      acaoTomada: record.acaoTomada ?? "",
      sugestaoTratativa: record.sugestaoTratativa ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="anomalias-${Date.now()}.xlsx"`,
    },
  });
}
