import { notFound } from "next/navigation";
import { requireGestor } from "@/lib/auth/dal";
import { getAudit } from "@/lib/data/audits";
import { resolveBrandColors } from "@/lib/branding";
import { renderAuditPdf } from "@/lib/pdf/audit-report";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireGestor();
  const { id } = await params;
  const audit = await getAudit(Number(id), user.organizationId!);
  if (!audit || audit.status !== "finalizada") notFound();

  const pdf = await renderAuditPdf(audit, {
    name: user.organizationName ?? "Kenkyo",
    logoUrl: user.organizationLogoUrl,
    brandColor: resolveBrandColors(user.organizationPrimaryColor).red,
  }, new URL(req.url).origin);

  const slug = `${audit.unitName}-${audit.visitDate}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .toLowerCase();
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="auditoria-${slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
