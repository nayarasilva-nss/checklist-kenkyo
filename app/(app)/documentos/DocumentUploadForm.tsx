"use client";

import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { createDocument } from "@/lib/actions/documents";

export function DocumentUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um arquivo");
      return;
    }
    const fd = new FormData(event.currentTarget);

    setUploading(true);
    setError(undefined);
    let fileUrl: string;
    try {
      const blob = await upload(`documentos/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      fileUrl = blob.url;
    } catch {
      setUploading(false);
      setError("Falha ao enviar o arquivo. Tente novamente.");
      return;
    }
    setUploading(false);
    fd.set("fileUrl", fileUrl);

    startTransition(async () => {
      const result = await createDocument(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setFile(null);
        formRef.current?.reset();
      }
    });
  }

  const busy = uploading || isPending;

  return (
    <form className="inline-form" ref={formRef} onSubmit={handleSubmit}>
      <h4>Adicionar Documento</h4>
      <div className="form-group">
        <label htmlFor="docTitle">Título</label>
        <input id="docTitle" name="title" placeholder="Ex: Ficha Técnica - Temaki Salmão" required />
      </div>
      <div className="form-group">
        <label htmlFor="docCategory">Categoria</label>
        <select id="docCategory" name="category" defaultValue="ficha_tecnica">
          <option value="ficha_tecnica">Ficha Técnica</option>
          <option value="pop">POP</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="docFile">Arquivo (PDF ou imagem)</label>
        <input
          id="docFile"
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button className="btn-save" type="submit" disabled={busy}>
          {uploading ? "Enviando arquivo..." : busy ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
