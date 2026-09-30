import "server-only";
import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { Row, generatedAtNow, loadImage, shared } from "./shared";
import type { getChecklistExportData } from "@/lib/data/checklists";

type ChecklistData = NonNullable<Awaited<ReturnType<typeof getChecklistExportData>>>;

const STATUS_LABEL: Record<string, string> = {
  conforme: "Conforme",
  "nao-conforme": "Não conforme",
  "nao-se-aplica": "Não se aplica",
  pending: "Pendente",
};

const COLS = [undefined, 90, undefined];

export async function renderChecklistPdf(
  data: ChecklistData,
  org: { name: string; logoUrl: string | null },
  origin: string,
) {
  const total = data.items.length;
  const done = data.items.filter((i) => i.status !== "pending").length;
  const date = new Date(`${data.date}T00:00:00`).toLocaleDateString("pt-BR");

  const logo = (await loadImage(org.logoUrl ?? "/kenkyo-logo.png", origin)) ?? (await loadImage("/kenkyo-logo.png", origin));

  const pdf = await renderToBuffer(
    <Document title={`${data.checklistType.name} ${date}`} author={org.name}>
      <Page size="A4" style={shared.page}>
        <View style={shared.head}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não tem alt */}
          {logo && <Image src={logo} style={shared.logo} />}
          <View>
            <Text style={shared.h1}>{data.checklistType.name}</Text>
            <Text style={shared.sub}>{org.name} · {data.unitName ?? "—"}</Text>
            <Text style={shared.badge}>{done}/{total} concluídos</Text>
          </View>
        </View>

        <View style={shared.grid}>
          <View style={shared.gridCell}><Text style={shared.label}>Responsável</Text><Text style={shared.gridText}>{data.userName}</Text></View>
          <View style={shared.gridCell}><Text style={shared.label}>Unidade</Text><Text style={shared.gridText}>{data.unitName ?? "—"}</Text></View>
          <View style={shared.gridCell}><Text style={shared.label}>Data</Text><Text style={shared.gridText}>{date}</Text></View>
        </View>

        <View style={shared.table}>
          <Row header cells={["Item", "Status", "Justificativa"]} widths={COLS} />
          {data.items.map((item, i) => (
            <Row
              key={i}
              widths={COLS}
              cells={[item.label, STATUS_LABEL[item.status] ?? item.status, item.justification ?? "—"]}
            />
          ))}
        </View>

        <Text style={shared.endNote}>Documento gerado pelo sistema {org.name} em {generatedAtNow()}</Text>
        <Text style={shared.pageNo} fixed render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
      </Page>
    </Document>,
  );
  return pdf;
}
