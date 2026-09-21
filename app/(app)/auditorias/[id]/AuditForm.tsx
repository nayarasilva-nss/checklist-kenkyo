"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { saveAuditAnswer, saveAuditTexts, finalizeAudit } from "@/lib/actions/audits";
import { AUDIT_STATUS_LABEL, WEIGHT_LABEL, type AuditStatus } from "@/lib/audit-scoring";

type Answer = {
  id: number;
  groupName: string;
  itemLabel: string;
  weight: number;
  howToVerify: string;
  responsible: string;
  appliesTo: string;
  status: AuditStatus | null;
  note: string;
  photoUrls: string[];
};

const ORDER: AuditStatus[] = ["conforme", "parcial", "nao_conforme", "nao_aplica"];
const COLOR: Record<AuditStatus, string> = {
  conforme: "#16a34a",
  parcial: "#f5b800",
  nao_conforme: "#e63946",
  nao_aplica: "#8a8a8a",
};

async function compress(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function AuditForm({
  auditId,
  organizationId,
  initialAnswers,
  initialComments,
  initialPlan,
}: {
  auditId: number;
  organizationId: number;
  initialAnswers: Answer[];
  initialComments: string;
  initialPlan: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [comments, setComments] = useState(initialComments);
  const [plan, setPlan] = useState(initialPlan);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, startFinalize] = useTransition();

  async function persist(next: Answer) {
    setAnswers((prev) => prev.map((a) => (a.id === next.id ? next : a)));
    const res = await saveAuditAnswer(auditId, next.id, {
      status: next.status,
      note: next.note,
      photoUrls: next.photoUrls,
    });
    if (res.error) setError(res.error);
  }

  async function addPhotos(answer: Answer, files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(answer.id);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const c = await compress(f);
        const blob = await upload(`org-${organizationId}/auditorias/${auditId}-${answer.id}-${Date.now()}-${c.name}`, c, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        urls.push(blob.url);
      }
      await persist({ ...answer, photoUrls: [...answer.photoUrls, ...urls] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a foto");
    } finally {
      setBusy(null);
    }
  }

  const groups: string[] = [];
  for (const a of answers) if (!groups.includes(a.groupName)) groups.push(a.groupName);
  const answered = answers.filter((a) => a.status).length;

  function finalize() {
    setError(null);
    startFinalize(async () => {
      const t = await saveAuditTexts(auditId, comments, plan);
      if (t.error) return setError(t.error);
      const res = await finalizeAudit(auditId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <>
      <p className="items-count" style={{ marginBottom: 12 }}>
        {answered}/{answers.length} itens respondidos · salva automaticamente
      </p>

      {groups.map((g) => (
        <div className="today-card" key={g} style={{ marginBottom: 16 }}>
          <div className="today-card-title" style={{ marginBottom: 12 }}>{g}</div>
          {answers.filter((a) => a.groupName === g).map((a) => (
            <div key={a.id} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}>
              <div style={{ fontWeight: 600 }}>
                {a.itemLabel} <span className="items-count">· {WEIGHT_LABEL[a.weight]}</span>
              </div>
              <p className="items-count" style={{ margin: "2px 0 8px" }}>
                {[a.howToVerify, a.responsible && `Resp.: ${a.responsible}`, a.appliesTo !== "Todas" && `Aplicável: ${a.appliesTo}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn-small"
                    aria-pressed={a.status === s}
                    onClick={() => persist({ ...a, status: a.status === s ? null : s })}
                    style={
                      a.status === s
                        ? { background: COLOR[s], color: s === "parcial" ? "#1c1917" : "#fff", borderColor: COLOR[s] }
                        : undefined
                    }
                  >
                    {AUDIT_STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              {a.status && a.status !== "conforme" && a.status !== "nao_aplica" && (
                <textarea
                  aria-label="Observação"
                  placeholder="O que foi observado?"
                  defaultValue={a.note}
                  rows={2}
                  style={{ width: "100%", marginTop: 8 }}
                  onBlur={(e) => e.target.value !== a.note && persist({ ...a, note: e.target.value })}
                />
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
                {a.photoUrls.map((u) => (
                  <span key={u} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" width={72} height={72} style={{ objectFit: "cover", borderRadius: 6 }} />
                    <button
                      type="button"
                      aria-label="Remover foto"
                      onClick={() => persist({ ...a, photoUrls: a.photoUrls.filter((x) => x !== u) })}
                      style={{ position: "absolute", top: -6, right: -6, borderRadius: "50%", width: 20, height: 20, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <label className="btn-small" style={{ cursor: "pointer" }}>
                  {busy === a.id ? "Enviando..." : "+ Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={busy === a.id}
                    onChange={(e) => {
                      addPhotos(a, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="today-card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label htmlFor="auditComments">Outros comentários</label>
          <textarea id="auditComments" rows={5} value={comments} onChange={(e) => setComments(e.target.value)} onBlur={() => saveAuditTexts(auditId, comments, plan)} />
        </div>
        <div className="form-group">
          <label htmlFor="auditPlan">Plano de ação</label>
          <textarea id="auditPlan" rows={4} value={plan} onChange={(e) => setPlan(e.target.value)} onBlur={() => saveAuditTexts(auditId, comments, plan)} />
        </div>
        {error && <p className="login-error">{error}</p>}
        <button className="btn-save" type="button" disabled={finalizing || answered < answers.length} onClick={finalize}>
          {finalizing ? "Finalizando..." : "Finalizar auditoria"}
        </button>
        {answered < answers.length && <p className="items-count">Responda todos os itens para finalizar.</p>}
      </div>
    </>
  );
}
