"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cancelRequisicao, conferirRequisicao } from "@/lib/actions/requisicoes";
import { NovaRequisicaoForm } from "./NovaRequisicaoForm";
import type { EditingRequisicao } from "./NovaRequisicaoForm";
import { QuantidadeStepper } from "./QuantidadeStepper";

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
  podeEditar: boolean;
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
  const [qtds, setQtds] = useState<Record<number, number>>(() =>
    Object.fromEntries(requisicao.itens.map((item) => [item.id, Number(item.qtdPedida)])),
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData();
    fd.set("id", String(requisicao.id));
    for (const [itemId, qtd] of Object.entries(qtds)) {
      fd.set(`qtd-${itemId}`, String(qtd));
    }
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
      {requisicao.itens.map((item) => (
        <div className="list-item" key={item.id}>
          <div className="info">
            <h4>{item.nome}</h4>
            <p>Pedido: {item.qtdPedida}{item.unidadeMedida}</p>
          </div>
          <div className="list-item-actions">
            <QuantidadeStepper
              value={qtds[item.id] ?? 0}
              unidade={item.unidadeMedida}
              onChange={(v) => setQtds((prev) => ({ ...prev, [item.id]: v }))}
            />
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
  units,
  todayWeekday,
  criarTiposPermitidos,
}: {
  records: Requisicao[];
  tipo: string | null;
  tabs: ("interna" | "externa")[];
  canCreate: boolean;
  canConferir: boolean;
  currentUserId: number;
  categorias: { id: number; name: string; orderDays: number[] }[];
  catalogItems: {
    id: number;
    name: string;
    unitMeasure: string;
    categoryId: number | null;
    categoryName: string | null;
  }[];
  units: { id: number; name: string }[];
  todayWeekday: number;
  criarTiposPermitidos: ("interna" | "externa")[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = records.find((r) => r.id === selectedId) ?? null;
  const editingRecord = records.find((r) => r.id === editingId) ?? null;

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

      <div className="data-table">
        <div className="data-table-head data-table-cols-requisicoes">
          <span className="col-tipo">Tipo</span>
          <span className="col-data">Data</span>
          <span className="col-solicitante">Solicitante</span>
          <span className="col-unidade">Unidade</span>
          <span className="col-status">Status</span>
        </div>
        {records.length === 0 ? (
          <div className="data-table-empty">Nenhuma requisição por aqui.</div>
        ) : (
          records.map((r) => (
            <div
              key={r.id}
              className={`data-table-row data-table-cols-requisicoes${selectedId === r.id ? " selected" : ""}`}
              onClick={() => openDetail(r.id)}
            >
              <span className="col-tipo">
                <span className={`badge ${r.tipo === "interna" ? "badge-info" : "badge-violet"}`}>
                  {r.tipo === "interna" ? "Interna" : "Externa"}
                </span>
              </span>
              <span className="col-data">{formatDate(r.createdAt)}</span>
              <span className="col-solicitante">{r.requesterName}</span>
              <span className="col-unidade">{r.unitName}</span>
              <span className="col-status">
                {r.urgente && <span className="badge badge-danger">URGENTE</span>}{" "}
                <span className={`badge ${STATUS_BADGE[r.status] ?? "badge-neutral"}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelectedId(null)}>
          <div className="modal-panel modal-panel-wide" onClick={(e) => e.stopPropagation()}>
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
                {/* Plain <a>, not next/link: Link's client-side routing
                    interception doesn't play well with target="_blank"
                    in this Next.js version — clicking it silently did
                    nothing instead of opening the print page. */}
                <a
                  href={`/requisicoes/${selected.id}/imprimir`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pdf"
                >
                  📥 PDF
                </a>
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
                {selected.podeEditar && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedId(null);
                      setEditingId(selected.id);
                    }}
                  >
                    Editar requisição
                  </button>
                )}
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
          </div>
        </div>
      )}

      {(creating || editingRecord) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setCreating(false);
            setEditingId(null);
          }}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <div className="detail-panel-title">
                {editingRecord ? "Editar requisição" : "Nova requisição"}
              </div>
              <button
                type="button"
                className="detail-panel-close"
                onClick={() => {
                  setCreating(false);
                  setEditingId(null);
                }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <NovaRequisicaoForm
              tiposPermitidos={criarTiposPermitidos}
              categorias={categorias}
              catalogItems={catalogItems}
              units={units}
              todayWeekday={todayWeekday}
              editing={
                editingRecord
                  ? ({
                      id: editingRecord.id,
                      tipo: editingRecord.tipo === "externa" ? "externa" : "interna",
                      urgente: editingRecord.urgente,
                      observacao: editingRecord.observacao,
                      itens: editingRecord.itens.map((item) => ({
                        catalogItemId:
                          catalogItems.find((c) => c.name === item.nome)?.id ?? null,
                        nome: item.nome,
                        unidadeMedida: item.unidadeMedida,
                        qtdPedida: Number(item.qtdPedida),
                      })),
                    } satisfies EditingRequisicao)
                  : undefined
              }
              onSuccess={() => {
                setCreating(false);
                setEditingId(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
