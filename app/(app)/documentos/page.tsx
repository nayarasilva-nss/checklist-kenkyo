import { getCurrentUser } from "@/lib/auth/dal";
import { getDocuments } from "@/lib/data/documents";
import {
  FICHA_TECNICA_CATEGORY_ORDER,
  FICHA_TECNICA_OUTRAS,
} from "@/lib/domain/ficha-tecnica-categorias";
import { DocumentRow } from "./DocumentRow";
import { DocumentUploadForm } from "./DocumentUploadForm";

export default async function DocumentosPage() {
  const user = await getCurrentUser();
  const isGestor = user.profile === "gestor";
  const allDocuments = await getDocuments();

  const fichasTecnicas = allDocuments.filter((d) => d.category === "ficha_tecnica");
  const pops = allDocuments.filter((d) => d.category === "pop");

  const fichaGroups = [...FICHA_TECNICA_CATEGORY_ORDER, FICHA_TECNICA_OUTRAS].map((categoria) => ({
    categoria,
    docs: fichasTecnicas.filter((d) =>
      categoria === FICHA_TECNICA_OUTRAS
        ? !d.subcategory || !(FICHA_TECNICA_CATEGORY_ORDER as readonly string[]).includes(d.subcategory)
        : d.subcategory === categoria,
    ),
  }));

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
          fichaGroups
            .filter((group) => group.docs.length > 0)
            .map((group) => (
              <div key={group.categoria} className="document-category">
                <h4>{group.categoria}</h4>
                {group.docs.map((doc) =>
                  isGestor ? (
                    <DocumentRow key={doc.id} doc={doc} />
                  ) : (
                    <div className="report-item" key={doc.id}>
                      <a
                        href={`/api/documentos/${doc.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {doc.title}
                      </a>
                    </div>
                  ),
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
          pops.map((doc) =>
            isGestor ? (
              <DocumentRow key={doc.id} doc={doc} />
            ) : (
              <div className="report-item" key={doc.id}>
                <a href={`/api/documentos/${doc.id}/view`} target="_blank" rel="noopener noreferrer">
                  {doc.title}
                </a>
              </div>
            ),
          )
        )}
      </div>
    </>
  );
}
