import { getCurrentUser } from "@/lib/auth/dal";
import { getDocuments } from "@/lib/data/documents";
import { deleteDocument } from "@/lib/actions/documents";
import { DeleteButton } from "../gerenciar/DeleteButton";
import { DocumentUploadForm } from "./DocumentUploadForm";

export default async function DocumentosPage() {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const allDocuments = await getDocuments();

  const fichasTecnicas = allDocuments.filter((d) => d.category === "ficha_tecnica");
  const pops = allDocuments.filter((d) => d.category === "pop");

  return (
    <>
      <h2>Fichas Técnicas e POPs</h2>

      {isGestor && (
        <div className="report-section">
          <DocumentUploadForm />
        </div>
      )}

      <div className="report-section">
        <h3>📑 Fichas Técnicas</h3>
        {fichasTecnicas.length === 0 ? (
          <p className="empty-state">Nenhuma ficha técnica cadastrada ainda</p>
        ) : (
          fichasTecnicas.map((doc) => (
            <div className="report-item" key={doc.id}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                {doc.title}
              </a>
              {isGestor && (
                <DeleteButton
                  action={deleteDocument}
                  id={doc.id}
                  confirmText={`Remover "${doc.title}"?`}
                />
              )}
            </div>
          ))
        )}
      </div>

      <div className="report-section">
        <h3>📗 POPs</h3>
        {pops.length === 0 ? (
          <p className="empty-state">Nenhum POP cadastrado ainda</p>
        ) : (
          pops.map((doc) => (
            <div className="report-item" key={doc.id}>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                {doc.title}
              </a>
              {isGestor && (
                <DeleteButton
                  action={deleteDocument}
                  id={doc.id}
                  confirmText={`Remover "${doc.title}"?`}
                />
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
