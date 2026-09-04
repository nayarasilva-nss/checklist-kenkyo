import { getCurrentUser } from "@/lib/auth/dal";
import { getDocuments } from "@/lib/data/documents";
import { DocumentosBoard } from "./DocumentosBoard";
import { DocumentUploadForm } from "./DocumentUploadForm";

export default async function DocumentosPage() {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const allDocuments = await getDocuments();

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Fichas e POPs</h2>
      </div>

      {isGestor && (
        <div className="today-card" style={{ marginBottom: 20 }}>
          <DocumentUploadForm />
        </div>
      )}

      <DocumentosBoard documents={allDocuments} isGestor={isGestor} />
    </>
  );
}
