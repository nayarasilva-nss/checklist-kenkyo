import "server-only";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { AUDIT_STATUS_LABEL, WEIGHT_LABEL, classifyAudit, computeAuditScore } from "@/lib/audit-scoring";
import type { getAudit } from "@/lib/data/audits";

// Relatório de auditoria gerado no servidor. Antes era a página
// /imprimir + "Salvar como PDF" do navegador, e cada navegador (Chrome
// desktop, Safari/Chrome no celular) paginava diferente — a mesma
// auditoria saía com 5 ou 7 páginas. Aqui o arquivo é sempre o mesmo.
//
// Fonte Helvetica (embutida no PDF, cobre acentos do português). Evite
// símbolos fora do Latin-1 (≥, ⚠, ▲, emoji): não existem nela.

// O hifenizador padrão é o do inglês ("NÃO CON-FORME"); sem ele, a
// palavra inteira vai para a linha de baixo.
Font.registerHyphenationCallback((word) => [word]);

type Audit = NonNullable<Awaited<ReturnType<typeof getAudit>>>;

const INK = "#16140f";
const MUTED = "#65635a";
const FAINT = "#a19f92";
const LINE = "#e3e1da";
const GREEN = "#16a34a";
const YELLOW = "#f5b800";
const RED = "#e63946";

const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 50, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  head: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 2.5, paddingBottom: 12, marginBottom: 16 },
  logo: { width: 40, height: 40, objectFit: "contain" },
  h1: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sub: { fontSize: 9.5, color: MUTED },
  badge: { alignSelf: "flex-start", marginTop: 5, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 4, fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  grid: { flexDirection: "row", gap: 18, marginBottom: 14 },
  gridCell: { flex: 1 },
  label: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: FAINT, marginBottom: 2, letterSpacing: 0.4 },
  score: { flexDirection: "row", gap: 12, marginBottom: 14 },
  scoreMain: { width: 135, borderWidth: 1, borderColor: LINE, borderRadius: 7, padding: 10, alignItems: "center" },
  scoreN: { fontSize: 32, fontFamily: "Helvetica-Bold", marginTop: 4 },
  scoreSide: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 7, padding: 10 },
  stack: { flexDirection: "row", height: 9, borderRadius: 4.5, overflow: "hidden", backgroundColor: LINE, marginVertical: 7 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, fontSize: 8.5, color: "#3d3b35" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 3 },
  sec: { fontSize: 9.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 16, marginBottom: 7, paddingLeft: 7, borderLeftWidth: 3 },
  tr: { flexDirection: "row", borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: LINE },
  th: { flexDirection: "row", backgroundColor: INK, color: "#ffffff", fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  td: { padding: 5, borderRightWidth: 1, borderColor: LINE },
  tdLast: { padding: 5 },
  bar: { height: 6, borderRadius: 3, backgroundColor: LINE, overflow: "hidden", marginTop: 2 },
  tag: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 5 },
  photo: { width: "31%", height: 70, objectFit: "cover", borderRadius: 3 },
  textBox: { borderWidth: 1, borderColor: LINE, borderRadius: 5, padding: 8 },
  // fontSize explícito: lineHeight sem unidade é multiplicado pela fonte
  // do próprio elemento, e sem ela o react-pdf usa 18pt (linhas enormes).
  textBody: { fontSize: 9.5, lineHeight: 1.35 },
  sign: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 28, marginTop: 44, fontSize: 8.5, color: "#3d3b35" },
  signLine: { width: 160, borderTopWidth: 1, borderColor: INK, paddingTop: 4, alignItems: "center" },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: FAINT },
});

/** Baixa uma imagem e devolve só se for JPEG ou PNG (os formatos que o
 * PDF aceita); qualquer outra coisa (HEIC, WebP, SVG, erro de rede) é
 * ignorada em vez de derrubar o relatório inteiro. */
async function loadImage(src: string, origin: string): Promise<Buffer | null> {
  try {
    const res = await fetch(new URL(src, origin), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8;
    const png = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    return jpeg || png ? buf : null;
  } catch {
    return null;
  }
}

function Row({ cells, widths, header }: { cells: React.ReactNode[]; widths: (number | undefined)[]; header?: boolean }) {
  return (
    <View style={header ? s.th : s.tr} wrap={false}>
      {cells.map((c, i) => (
        <View
          key={i}
          style={[
            i === cells.length - 1 ? s.tdLast : s.td,
            widths[i] ? { width: widths[i] } : { flex: 1 },
            header ? { borderColor: "#3d3b35" } : {},
          ]}
        >
          {typeof c === "string" || typeof c === "number" ? <Text>{c}</Text> : c}
        </View>
      ))}
    </View>
  );
}

export async function renderAuditPdf(
  audit: Audit,
  org: { name: string; logoUrl: string | null; brandColor: string },
  /** Origem do site (ex.: https://app.exemplo.com), para achar o logo padrão em /public. */
  origin: string,
) {
  const { percent, groupScores, counts } = computeAuditScore(audit.answers);
  const cls = classifyAudit(percent);
  const scoreColor = cls.color === YELLOW ? "#b58900" : cls.color;
  const applicable = counts.conforme + counts.parcial + counts.nao_conforme;
  const naCount = audit.answers.filter((a) => a.status === "nao_aplica").length;
  const seg = (n: number) => `${applicable ? (n / applicable) * 100 : 0}%`;
  const date = new Date(`${audit.visitDate}T00:00:00`).toLocaleDateString("pt-BR");
  const issues = audit.answers
    .filter((a) => a.status === "nao_conforme" || a.status === "parcial")
    .sort((a, b) => b.weight - a.weight || (a.status === "nao_conforme" ? -1 : 1));
  const criticalOpen = issues.filter((a) => a.weight === 3 && a.status === "nao_conforme").length;
  const brand = org.brandColor;
  const generatedAt = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Todas as imagens em paralelo, antes de montar o documento.
  const photoUrls = [...new Set(issues.flatMap((a) => a.photoUrls))];
  const [logo, ...photoBufs] = await Promise.all([
    loadImage(org.logoUrl ?? "/kenkyo-logo.png", origin).then((b) => b ?? loadImage("/kenkyo-logo.png", origin)),
    ...photoUrls.map((u) => loadImage(u, origin)),
  ]);
  const photos = new Map(photoUrls.map((u, i) => [u, photoBufs[i]]));

  const doc = (
    <Document title={`Auditoria ${audit.unitName} ${date}`} author={org.name}>
      <Page size="A4" style={s.page}>
        <View style={[s.head, { borderColor: brand }]}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não tem alt */}
          {logo && <Image src={logo} style={s.logo} />}
          <View>
            <Text style={s.h1}>Auditoria de Unidade</Text>
            <Text style={s.sub}>{org.name} · {audit.unitName}</Text>
            <Text style={[s.badge, { backgroundColor: cls.color, color: cls.label === "Bom" ? INK : "#ffffff" }]}>
              {audit.scorePercent ?? percent}% · {cls.label}
            </Text>
          </View>
        </View>

        <View style={s.grid}>
          <View style={s.gridCell}><Text style={s.label}>Unidade</Text><Text>{audit.unitName}</Text></View>
          <View style={s.gridCell}><Text style={s.label}>Data da visita</Text><Text>{date}</Text></View>
          <View style={s.gridCell}>
            <Text style={s.label}>{audit.coAuditorName ? "Auditores" : "Auditor"}</Text>
            <Text>{audit.auditorName}</Text>
            {audit.coAuditorName && <Text>{audit.coAuditorName}</Text>}
          </View>
        </View>

        <View style={s.score} wrap={false}>
          <View style={s.scoreMain}>
            <Text style={s.label}>Nota geral</Text>
            <Text style={[s.scoreN, { color: scoreColor }]}>{percent}%</Text>
            <Text style={{ marginTop: 4, fontFamily: "Helvetica-Bold" }}>{cls.label}</Text>
          </View>
          <View style={s.scoreSide}>
            <Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{applicable} critérios avaliados</Text>
              {naCount > 0 ? ` · ${naCount} não se aplicam` : ""}
            </Text>
            <View style={s.stack}>
              <View style={{ width: seg(counts.conforme), backgroundColor: GREEN }} />
              <View style={{ width: seg(counts.parcial), backgroundColor: YELLOW }} />
              <View style={{ width: seg(counts.nao_conforme), backgroundColor: RED }} />
            </View>
            <View style={s.legend}>
              {([["Conformes", counts.conforme, GREEN], ["Parciais", counts.parcial, YELLOW], ["Não conformes", counts.nao_conforme, RED]] as const).map(
                ([l, n, c]) => (
                  <View key={l} style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={[s.dot, { backgroundColor: c }]} />
                    <Text>{l} {n}</Text>
                  </View>
                ),
              )}
            </View>
            {criticalOpen > 0 && (
              <Text style={{ marginTop: 8, color: "#b3261e", fontFamily: "Helvetica-Bold" }}>
                Atenção: {criticalOpen} {criticalOpen === 1 ? "critério crítico não conforme" : "critérios críticos não conformes"}
              </Text>
            )}
          </View>
        </View>

        <Text style={[s.sec, { borderColor: brand }]} minPresenceAhead={40}>Nota por grupo</Text>
        <Row header cells={["Grupo", "Nota", "Desempenho"]} widths={[undefined, 50, 130]} />
        {groupScores.map((g) => (
          <Row
            key={g.name}
            widths={[undefined, 50, 130]}
            cells={[
              g.name,
              <Text key="n" style={{ fontFamily: "Helvetica-Bold" }}>{g.percent}%</Text>,
              <View key="b" style={s.bar}>
                <View style={{ width: `${g.percent}%`, height: "100%", backgroundColor: classifyAudit(g.percent).color }} />
              </View>,
            ]}
          />
        ))}
        <View style={[s.legend, { marginTop: 5 }]}>
          <Text>Excelente: 90% ou mais</Text>
          <Text>Bom: 75–89%</Text>
          <Text>Regular: 60–74%</Text>
          <Text>Inadequado: abaixo de 60%</Text>
        </View>

        <Text style={[s.sec, { borderColor: brand }]} minPresenceAhead={60}>Apontamentos ({issues.length})</Text>
        {issues.length === 0 ? (
          <Text>Nenhuma inconformidade registrada nesta visita.</Text>
        ) : (
          <>
            <Row header cells={["Critério", "Peso", "Situação", "Observação"]} widths={[165, 46, 84, undefined]} />
            {issues.map((a) => {
              const imgs = a.photoUrls.map((u) => photos.get(u)).filter((b): b is Buffer => !!b);
              return (
                <Row
                  key={a.id}
                  widths={[165, 46, 84, undefined]}
                  cells={[
                    <View key="c">
                      <Text style={[s.tag, { color: FAINT }]}>{a.groupName}</Text>
                      <Text>{a.itemLabel}</Text>
                      {a.responsible ? <Text style={{ color: MUTED, fontSize: 8 }}>Resp.: {a.responsible}</Text> : null}
                    </View>,
                    WEIGHT_LABEL[a.weight] ?? "",
                    <Text key="s" style={[s.tag, { color: a.status === "nao_conforme" ? "#b3261e" : "#8a6d00" }]}>
                      {AUDIT_STATUS_LABEL[a.status!]}
                    </Text>,
                    <View key="o">
                      <Text>{a.note || "—"}</Text>
                      {imgs.length > 0 && (
                        <View style={s.photos}>
                          {imgs.map((b, i) => (
                            // eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não tem alt
                            <Image key={i} src={b} style={s.photo} />
                          ))}
                        </View>
                      )}
                    </View>,
                  ]}
                />
              );
            })}
          </>
        )}

        {audit.comments ? (
          <View>
            <Text style={[s.sec, { borderColor: brand }]} minPresenceAhead={40}>
              {audit.coAuditorName ? "Comentários dos auditores" : "Comentários do auditor"}
            </Text>
            <View style={s.textBox}><Text style={s.textBody}>{audit.comments}</Text></View>
          </View>
        ) : null}
        {audit.actionPlan ? (
          <View>
            <Text style={[s.sec, { borderColor: brand }]} minPresenceAhead={40}>Plano de ação</Text>
            <View style={s.textBox}><Text style={s.textBody}>{audit.actionPlan}</Text></View>
          </View>
        ) : null}

        <View style={s.sign} wrap={false}>
          {[audit.auditorName, audit.coAuditorName].filter(Boolean).map((n) => (
            <View key={n} style={s.signLine}><Text>{n}</Text><Text>Auditor</Text></View>
          ))}
          <View style={s.signLine}><Text>Responsável da unidade</Text><Text>Nome e assinatura</Text></View>
        </View>

        <View style={s.footer} fixed>
          <Text>{org.name} · Auditoria {audit.unitName} · {date} · gerado em {generatedAt}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
