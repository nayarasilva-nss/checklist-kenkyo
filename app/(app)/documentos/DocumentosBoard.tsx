"use client";

import { useMemo, useState } from "react";
import {
  FICHA_TECNICA_CATEGORY_ORDER,
  FICHA_TECNICA_OUTRAS,
} from "@/lib/domain/ficha-tecnica-categorias";
import { DocumentRow } from "./DocumentRow";

type Doc = {
  id: number;
  title: string;
  category: string;
  subcategory: string | null;
  fileUrl: string;
  createdAt: Date;
};

const POPS_KEY = "__pops__";

export function DocumentosBoard({ documents, isGestor }: { documents: Doc[]; isGestor: boolean }) {
  const categories = useMemo(() => {
    const fichas = documents.filter((d) => d.category === "ficha_tecnica");
    const pops = documents.filter((d) => d.category === "pop");
    const groups = [...FICHA_TECNICA_CATEGORY_ORDER, FICHA_TECNICA_OUTRAS].map((categoria) => ({
      key: categoria,
      label: categoria,
      docs: fichas.filter((d) =>
        categoria === FICHA_TECNICA_OUTRAS
          ? !d.subcategory ||
            !(FICHA_TECNICA_CATEGORY_ORDER as readonly string[]).includes(d.subcategory)
          : d.subcategory === categoria,
      ),
    }));
    return [...groups.filter((g) => g.docs.length > 0), { key: POPS_KEY, label: "POPs", docs: pops }];
  }, [documents]);

  const [selected, setSelected] = useState<string>(categories[0]?.key ?? POPS_KEY);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"nome" | "recentes">("nome");

  const searching = search.trim().length > 0;
  const activeCategory = categories.find((c) => c.key === selected) ?? categories[0];

  const visibleDocs = useMemo(() => {
    const pool = searching ? documents : (activeCategory?.docs ?? []);
    const query = search.trim().toLowerCase();
    const filtered = searching
      ? pool.filter((d) => d.title.toLowerCase().includes(query))
      : pool;
    return [...filtered].sort((a, b) =>
      sort === "nome"
        ? a.title.localeCompare(b.title)
        : b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [documents, activeCategory, search, searching, sort]);

  return (
    <>
      <input
        type="search"
        className="search-input"
        placeholder="Buscar por prato, insumo ou procedimento"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="doc-layout">
        <div className="doc-category-list">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`doc-category-link${!searching && selected === cat.key ? " active" : ""}`}
              onClick={() => {
                setSearch("");
                setSelected(cat.key);
              }}
            >
              {cat.label}
              <span className="doc-category-count">{cat.docs.length}</span>
            </button>
          ))}
        </div>

        <div className="today-card">
          <div className="today-card-header">
            <div className="today-card-title">
              {searching
                ? `Resultados para "${search}"`
                : `${activeCategory?.label} · ${visibleDocs.length} documento${visibleDocs.length !== 1 ? "s" : ""}`}
            </div>
            {!searching && (
              <div className="filter-pills" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`pill${sort === "nome" ? " active" : ""}`}
                  onClick={() => setSort("nome")}
                >
                  Nome
                </button>
                <button
                  type="button"
                  className={`pill${sort === "recentes" ? " active" : ""}`}
                  onClick={() => setSort("recentes")}
                >
                  Mais recentes
                </button>
              </div>
            )}
          </div>

          {visibleDocs.length === 0 ? (
            <p className="empty-state">Nenhum documento encontrado</p>
          ) : (
            visibleDocs.map((doc) =>
              isGestor ? (
                <DocumentRow key={doc.id} doc={doc} />
              ) : (
                <div className="doc-row" key={doc.id}>
                  <span className={`badge ${doc.category === "pop" ? "badge-info" : "badge-brand"}`}>
                    {doc.category === "pop" ? "POP" : "FICHA"}
                  </span>
                  <span className="doc-row-title">{doc.title}</span>
                  <span className="doc-row-meta">
                    Atualizado em {doc.createdAt.toLocaleDateString("pt-BR")}
                  </span>
                  <a
                    className="btn-tertiary"
                    href={`/api/documentos/${doc.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir
                  </a>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </>
  );
}
