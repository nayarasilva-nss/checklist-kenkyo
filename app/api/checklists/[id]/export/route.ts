import { getCurrentUser } from "@/lib/auth/dal";
import { getChecklistExportData } from "@/lib/data/checklists";

const STATUS_LABELS = {
  conforme: "✓ Conforme",
  "nao-conforme": "✗ Não Conforme",
  pending: "○ Pendente",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const checklistTypeId = Number(id);

  if (!checklistTypeId) {
    return new Response("Checklist inválido", { status: 400 });
  }

  const data = await getChecklistExportData(checklistTypeId, user.id);
  if (!data) {
    return new Response("Checklist não encontrado", { status: 404 });
  }

  const rows = data.items
    .map(
      (item) => `<tr>
      <td>${escapeHtml(item.label)}</td>
      <td>${STATUS_LABELS[item.status]}</td>
      <td>${escapeHtml(item.justification ?? "")}</td>
      <td>${
        item.completedAt
          ? new Date(item.completedAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""
      }</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(data.checklistType.name)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #E63946; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #E63946; color: white; }
    .header { margin-bottom: 30px; }
    .footer { margin-top: 30px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Kenkyo - ${escapeHtml(data.checklistType.name)}</h1>
    <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
    <p><strong>Usuário:</strong> ${escapeHtml(user.name)}</p>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th>Status</th><th>Justificativa</th><th>Hora</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer"><p>Documento gerado automaticamente pelo sistema Kenkyo</p></div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(data.checklistType.name)}-${Date.now()}.html"`,
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilename(value: string) {
  // Content-Disposition filename must be ASCII-safe, so diacritics are stripped rather than kept.
  const ascii = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ascii.replace(/[^a-zA-Z0-9_ -]/g, "").trim() || "checklist";
}
