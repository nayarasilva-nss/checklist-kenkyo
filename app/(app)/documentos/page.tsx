import { getCurrentUser } from "@/lib/auth/dal";
import { isGestorProfile } from "@/lib/auth/profile";
import { getDocuments } from "@/lib/data/documents";
import { DocumentosBoard } from "./DocumentosBoard";
import { DocumentUploadForm } from "./DocumentUploadForm";

export default async function DocumentosPage() {
  const user = await getCurrentUser();
  const isGestor = isGestorProfile(user.profile);
  const allDocuments = await getDocuments(user.organizationId!);

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Fichas e POPs</h2>
      </div>

      {isGestor && (
        <div className="today-card" style={{ marginBottom: 20 }}>
          <DocumentUploadForm organizationId={user.organizationId ?? 0} />
        </div>
      )}

      <DocumentosBoard documents={allDocuments} isGestor={isGestor} />
    </>
  );
}
