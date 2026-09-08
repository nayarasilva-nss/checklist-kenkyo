"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cancelRequisicao, conferirRequisicao } from "@/lib/actions/requisicoes";
import { NovaRequisicaoForm } from "./NovaRequisicaoForm";

type RequisicaoItem = {
  id: number;
  nome: string;
  unidadeMedida: string;
  qtdPedida: string;
  qtdConferida: string | null;
};

type Requisicao = {
  id: number;
  tipo: string;
  unitId: number;
  unitName: string;
  requesterId: number;
  requesterName: string;
  urgente: boolean;
  observacao: string;
  status: string;
  conferidoPorId: number | null;
  createdAt: Date;
  editedAt: Date | null;
  concluidoEm: Date | null;
  itens: RequisicaoItem[];
};

const STATUS_BADGE: Record<string, string> = {
  aberta: "badge-warning",
  conferida: "badge-success",
  cancelada: "badge-neutral",
};

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  conferida: "Conferida",
  cancelada: "Cancelada",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function ConferirForm({ requisicao, onDone }: { requisicao: Requisicao; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await conferirRequisicao(undefined, fd);
      if (result?.error) setError(result.error);
      else onDone();
    });
  }

  const label =
    requisicao.tipo === "interna"
      ? "Confirmar o que saiu do estoque"
      : "Confirmar o que foi entregue";

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={requisicao.id} />
      {requisicao.itens.map((item) => (
        <div className="list-item" key={item.id}>
          <div className="info">
            <h4>{item.nome}</h4>
            <p>Pedido: {item.qtdPedida}{item.unidadeMedida}</p>
          </div>
          <div className="list-item-actions">
            <input
              type="number"
              name={`qtd-${item.id}`}
              min={0}
              step={0.5}
              defaultValue={item.qtdPedida}
              style={{ width: 70 }}
            />
            <span>{item.unidadeMedida}</span>
          </div>
        </div>
      ))}
      {error && <p className="login-error">{error}</p>}
      <div className="inline-form-buttons">
        <button className="btn-save" type="submit" disabled={isPending}>
          {label}
        </button>
      </div>
    </form>
  );
}

export function RequisicoesBoard({
  records,
  tipo,
  tabs,
  canCreate,
  canConferir,
  currentUserId,
  categorias,
  catalogItems,
  criarTiposPermitidos,
}: {
  records: Requisicao[];
  tipo: string | null;
  tabs: ("interna" | "externa")[];
  canCreate: boolean;
  canConferir: boolean;
  currentUserId: number;
  categorias: { id: number; name: string }[];
  catalogItems: {
    id: number;
    name: string;
    unitMeasure: string;
    categoryId: number | null;
    categoryName: string | null;
  }[];
  criarTiposPermitidos: ("interna" | "externa")[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  function setTipoParam(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("tipo", value);
    else params.delete("tipo");
    router.push(`${pathname}?${params.toString()}`);
  }

  function openDetail(id: number) {
    setCreating(false);
    setSelectedId((current) => (current === id ? null : id));
  }

  function openCreate() {
    setSelectedId(null);
    setCreating(true);
  }

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Requisições</h2>
        {canCreate && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            Nova requisição
          </button>
        )}
      </div>

      {tabs.length > 1 && (
        <div className="filter-pills">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`pill${(tipo ?? tabs[0]) === t ? " active" : ""}`}
              onClick={() => setTipoParam(t)}
            >
              {t === "interna" ? "Internas" : "Externas"}
            </button>
          ))}
        </div>
      )}

      <div className="board-layout">
        <div className="data-table">
          <div className="data-table-head" style={{ gridTemplateColumns: "90px 1fr 130px 110px" }}>
            <span>Status</span>
            <span>Itens</span>
            <span>Solicitante</span>
            <span>Data</span>
          </div>
          {records.length === 0 ? (
            <div className="data-table-empty">Nenhuma requisição por aqui.</div>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className={`data-table-row${selectedId === r.id ? " selected" : ""}`}
                style={{ gridTemplateColumns: "90px 1fr 130px 110px" }}
                onClick={() => openDetail(r.id)}
              >
                <span>
                  <span className={`badge ${STATUS_BADGE[r.status] ?? "badge-neutral"}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </span>
                <span>
                  {r.urgente && <span className="badge badge-danger">URGENTE</span>}{" "}
                  {r.itens
                    .slice(0, 3)
                    .map((i) => `${i.nome} (${i.qtdPedida}${i.unidadeMedida})`)
                    .join(", ")}
                  {r.itens.length > 3 ? ` +${r.itens.length - 3}` : ""}
                </span>
                <span>{r.requesterName}</span>
                <span>{formatDate(r.createdAt)}</span>
              </div>
            ))
          )}
        </div>

        <div className="detail-panel">
          {creating ? (
            <>
              <div className="detail-panel-header">
                <div className="detail-panel-title">Nova requisição</div>
                <button
                  type="button"
                  className="detail-panel-close"
                  onClick={() => setCreating(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
              <NovaRequisicaoForm
                tiposPermitidos={criarTiposPermitidos}
                categorias={categorias}
                catalogItems={catalogItems}
                onSuccess={() => setCreating(false)}
              />
            </>
          ) : selected ? (
            <>
              <div className="detail-panel-header">
                <div>
                  <span className={`badge ${STATUS_BADGE[selected.status] ?? "badge-neutral"}`}>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                  <div className="detail-panel-title" style={{ marginTop: 8 }}>
                    Requisição {selected.tipo} · {selected.unitName}
                  </div>
                  <div className="detail-panel-meta">
                    {selected.requesterName} · {formatDate(selected.createdAt)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    href={`/requisicoes/${selected.id}/imprimir`}
                    target="_blank"
                    className="btn-pdf"
                  >
                    📥 PDF
                  </Link>
                  <button
                    type="button"
                    className="detail-panel-close"
                    onClick={() => setSelectedId(null)}
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>
              </div>

              {selected.observacao && (
                <div className="detail-panel-fields">
                  <div>
                    <div className="detail-panel-field-label">Observação</div>
                    <div className="detail-panel-field-value">{selected.observacao}</div>
                  </div>
                </div>
              )}

              {canConferir && selected.status === "aberta" ? (
                <ConferirForm requisicao={selected} onDone={() => setSelectedId(null)} />
              ) : (
                <div>
                  {selected.itens.map((item) => (
                    <div className="list-item" key={item.id}>
                      <div className="info">
                        <h4>{item.nome}</h4>
                        <p>
                          Pedido: {item.qtdPedida}
                          {item.unidadeMedida}
                          {item.qtdConferida !== null &&
                            ` · Conferido: ${item.qtdConferida}${item.unidadeMedida}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected.requesterId === currentUserId && selected.status === "aberta" && (
                <div className="detail-panel-footer">
                  <form
                    action={cancelRequisicao}
                    onSubmit={(e) => {
                      if (!confirm("Cancelar esta requisição?")) e.preventDefault();
                      else setSelectedId(null);
                    }}
                  >
                    <input type="hidden" name="id" value={selected.id} />
                    <button type="submit" className="btn-destructive">
                      Cancelar requisição
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="detail-panel-empty">
              Selecione uma requisição na lista para ver os detalhes.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
