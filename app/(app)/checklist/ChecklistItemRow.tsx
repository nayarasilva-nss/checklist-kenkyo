"use client";

import { useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { setChecklistItemStatus } from "@/lib/actions/checklist";
import type { CompletionStatus } from "@/lib/data/checklists";

type Status = "conforme" | "nao-conforme" | "nao-se-aplica";

type Item = {
  id: number;
  label: string;
  requiresPhoto: boolean;
  status: CompletionStatus;
  justification: string | null;
  photoUrl: string | null;
};

const STATUS_CLASS: Record<CompletionStatus, string> = {
  conforme: "status-conforme",
  "nao-conforme": "status-nao-conforme",
  "nao-se-aplica": "status-nao-se-aplica",
  pending: "",
};

export function ChecklistItemRow({
  item,
  checklistTypeId,
}: {
  item: Item;
  checklistTypeId: number;
}) {
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [justification, setJustification] = useState(item.justification ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openForm(status: Status) {
    setJustification(status === "nao-conforme" ? (item.justification ?? "") : "");
    setPhotoFile(null);
    setError(null);
    setPendingStatus(status);
  }

  function handleStatusClick(status: Status) {
    if (item.requiresPhoto || status === "nao-conforme") {
      openForm(status);
      return;
    }
    submit(status, "", null);
  }

  function submit(status: Status, justificationValue: string, photoUrl: string | null) {
    const fd = new FormData();
    fd.set("itemId", String(item.id));
    fd.set("checklistTypeId", String(checklistTypeId));
    fd.set("status", status);
    if (justificationValue) fd.set("justification", justificationValue);
    if (photoUrl) fd.set("photoUrl", photoUrl);
    startTransition(async () => {
      const result = await setChecklistItemStatus(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setPendingStatus(null);
        setError(null);
      }
    });
  }

  async function handleSubmitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!pendingStatus) return;

    if (pendingStatus === "nao-conforme" && !justification.trim()) {
      setError("Justificativa é obrigatória");
      return;
    }

    let photoUrl: string | null = item.photoUrl;
    if (item.requiresPhoto) {
      if (!photoFile) {
        setError("Essa tarefa exige uma foto de evidência");
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const blob = await upload(
          `evidencias/${checklistTypeId}-${item.id}-${Date.now()}-${photoFile.name}`,
          photoFile,
          { access: "public", handleUploadUrl: "/api/upload" },
        );
        photoUrl = blob.url;
      } catch {
        setUploading(false);
        setError("Falha ao enviar a foto. Tente novamente.");
        return;
      }
      setUploading(false);
    }

    submit(pendingStatus, justification, photoUrl);
  }

  const busy = isPending || uploading;

  return (
    <div className={`checklist-item ${STATUS_CLASS[item.status]}`}>
      <div className="item-button-row">
        <button
          type="button"
          className={`btn-status btn-status-conforme ${item.status === "conforme" ? "active" : ""}`}
          onClick={() => handleStatusClick("conforme")}
          disabled={busy}
        >
          ✓ Conforme
        </button>
        <button
          type="button"
          className={`btn-status btn-status-nao-conforme ${item.status === "nao-conforme" ? "active" : ""}`}
          onClick={() => handleStatusClick("nao-conforme")}
          disabled={busy}
        >
          ✗ Não Conforme
        </button>
        <button
          type="button"
          className={`btn-status btn-status-nao-se-aplica ${item.status === "nao-se-aplica" ? "active" : ""}`}
          onClick={() => handleStatusClick("nao-se-aplica")}
          disabled={busy}
        >
          ➖ Não se Aplica
        </button>
        {item.requiresPhoto && (
          <span className="requires-photo-badge">📷 requer foto</span>
        )}
      </div>

      <span className="item-text">{item.label}</span>

      {pendingStatus && (
        <form className="justification-form" onSubmit={handleSubmitForm}>
          {pendingStatus === "nao-conforme" && (
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Motivo da não conformidade"
              required
            />
          )}
          {item.requiresPhoto && (
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          )}
          {error && <p className="login-error">{error}</p>}
          <div className="justification-form-buttons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setPendingStatus(null)}
            >
              Cancelar
            </button>
            <button className="btn-save" type="submit" disabled={busy}>
              {uploading ? "Enviando foto..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      {!pendingStatus && item.status === "nao-conforme" && item.justification && (
        <div className="justification-box">
          <strong>Justificativa:</strong> {item.justification}{" "}
          <button
            type="button"
            className="btn-small"
            onClick={() => openForm("nao-conforme")}
            style={{ marginLeft: 8 }}
          >
            Editar
          </button>
        </div>
      )}

      {!pendingStatus && item.photoUrl && (
        <div className="justification-box">
          <strong>Evidência:</strong>{" "}
          <a href={item.photoUrl} target="_blank" rel="noopener noreferrer">
            Ver foto
          </a>
        </div>
      )}
    </div>
  );
}
