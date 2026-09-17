import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { solicitacoes, solicitacaoItens, units, users } from "@/lib/db/schema";

export type SolicitacaoViewer = {
  id: number;
  profile: string;
};

export type SolicitacaoScope = { mode: "all" } | { mode: "own"; userId: number };

/**
 * Gestor vê e aprova todas as solicitações, de qualquer unidade. Gerente
 * (o único perfil que pede, além do Gestor) só vê as próprias — não
 * existe uma fila "da unidade" aqui como em requisição, porque toda
 * solicitação passa pelo Gestor de qualquer forma.
 */
export function resolveSolicitacaoScope(viewer: SolicitacaoViewer): SolicitacaoScope | null {
  if (viewer.profile === "gestor") return { mode: "all" };
  if (viewer.profile === "gerente") return { mode: "own", userId: viewer.id };
  return null;
}

function baseQuery() {
  return db
    .select({
      id: solicitacoes.id,
      unitId: solicitacoes.unitId,
      unitName: units.name,
      requesterId: solicitacoes.requesterId,
      requesterName: users.name,
      date: solicitacoes.date,
      urgente: solicitacoes.urgente,
      observacao: solicitacoes.observacao,
      status: solicitacoes.status,
      createdAt: solicitacoes.createdAt,
    })
    .from(solicitacoes)
    .innerJoin(units, eq(units.id, solicitacoes.unitId))
    .innerJoin(users, eq(users.id, solicitacoes.requesterId));
}

type ResumoVariant = "warning" | "success" | "danger" | "neutral" | "info";
export type ResumoSolicitacao = { label: string; variant: ResumoVariant };

type ItemForResumo = { status: string; comprado: boolean; chegou: boolean };

/**
 * Aprovação, compra e chegada são todas rastreadas por item — esse
 * resumo é o que reduz isso a um único rótulo pra lista e pro
 * cabeçalho do detalhe, sem esconder que o pedido está "no meio do
 * caminho" (alguns itens aprovados/comprados/chegados, outros não).
 */
export function resumoSolicitacao(
  solicitacao: { status: string },
  itens: ItemForResumo[],
): ResumoSolicitacao {
  if (solicitacao.status === "cancelada") return { label: "Cancelada", variant: "neutral" };
  if (itens.length === 0) return { label: "Sem itens", variant: "neutral" };

  const pendentes = itens.filter((i) => i.status === "pendente").length;
  const aprovados = itens.filter((i) => i.status === "aprovado");
  const reprovados = itens.filter((i) => i.status === "reprovado").length;

  if (pendentes === itens.length) {
    return { label: "Aguardando aprovação", variant: "warning" };
  }
  if (pendentes > 0) {
    return { label: `Aprovação parcial (${aprovados.length}/${itens.length})`, variant: "warning" };
  }
  if (aprovados.length === 0) {
    return { label: "Reprovada", variant: "danger" };
  }

  const prefixo = reprovados > 0 ? "Aprovada parcialmente" : "Aprovada";
  const comprados = aprovados.filter((i) => i.comprado).length;
  const chegados = aprovados.filter((i) => i.chegou).length;

  if (chegados === aprovados.length) {
    return { label: `${prefixo} · Concluída`, variant: "success" };
  }
  if (comprados === aprovados.length) {
    return { label: `${prefixo} · Comprada, aguardando entrega`, variant: "info" };
  }
  if (comprados > 0) {
    return { label: `${prefixo} · Compra parcial (${comprados}/${aprovados.length})`, variant: "info" };
  }
  return { label: `${prefixo} · Aguardando compra`, variant: "info" };
}

export async function getSolicitacoesByScope(scope: SolicitacaoScope) {
  const records =
    scope.mode === "own"
      ? await baseQuery().where(eq(solicitacoes.requesterId, scope.userId)).orderBy(desc(solicitacoes.createdAt))
      : await baseQuery().orderBy(desc(solicitacoes.createdAt));

  if (records.length === 0) return [];

  const ids = records.map((r) => r.id);
  const allItens = await db
    .select()
    .from(solicitacaoItens)
    .where(inArray(solicitacaoItens.solicitacaoId, ids))
    .orderBy(asc(solicitacaoItens.id));

  const itensBySolicitacao = new Map<number, typeof allItens>();
  for (const item of allItens) {
    const list = itensBySolicitacao.get(item.solicitacaoId) ?? [];
    list.push(item);
    itensBySolicitacao.set(item.solicitacaoId, list);
  }

  return records.map((r) => {
    const itens = itensBySolicitacao.get(r.id) ?? [];
    return { ...r, itens, resumo: resumoSolicitacao(r, itens) };
  });
}

export async function getSolicitacaoWithItens(id: number) {
  const [solicitacao] = await baseQuery().where(eq(solicitacoes.id, id)).limit(1);
  if (!solicitacao) return null;

  const itens = await db
    .select()
    .from(solicitacaoItens)
    .where(eq(solicitacaoItens.solicitacaoId, id))
    .orderBy(asc(solicitacaoItens.id));

  return { ...solicitacao, itens, resumo: resumoSolicitacao(solicitacao, itens) };
}
