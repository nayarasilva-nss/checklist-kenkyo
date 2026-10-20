import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { isGestorProfile } from "@/lib/auth/profile";
import { canVerEscala } from "@/lib/auth/escala";
import { getEscalaMes } from "@/lib/data/escala";
import { getUnits } from "@/lib/data/units";
import { checklistDayISO } from "@/lib/date-utils";
import { PREVIA, PREVIA_MES } from "@/lib/data/escala-previa";
import { UnitFilter } from "../UnitFilter";
import { EscalaTabela } from "./EscalaTabela";

// Prévia provisória (planilha de dezembro): só aparece para este usuário.
const PREVIA_PARA = "Nayara Silva";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function mesVizinho(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function EscalaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; unit?: string; previa?: string }>;
}) {
  const user = await getCurrentUser();
  if (!canVerEscala(user)) redirect("/hoje");

  const { mes: rawMes, unit: rawUnit, previa: rawPrevia } = await searchParams;
  const podePrevia = user.name === PREVIA_PARA && isGestorProfile(user.profile);
  const previa = podePrevia && rawPrevia && PREVIA[rawPrevia] ? rawPrevia : null;
  const hoje = checklistDayISO();
  const mes = rawMes && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMes) ? rawMes : hoje.slice(0, 7);

  const isGestor = isGestorProfile(user.profile);
  const units = isGestor ? await getUnits(user.organizationId!) : [];
  const unitId = isGestor ? (Number(rawUnit) || units[0]?.id || null) : await resolveEffectiveUnitId(user);
  const unitName = isGestor ? units.find((u) => u.id === unitId)?.name : null;

  const escala = unitId ? await getEscalaMes(user.organizationId!, unitId, mes) : null;
  const [ano, m] = mes.split("-").map(Number);
  const q = (mesAlvo: string) => `/escala?mes=${mesAlvo}${isGestor && unitId ? `&unit=${unitId}` : ""}`;

  return (
    <>
      <div className="page-topbar">
        <h2 style={{ marginBottom: 0 }}>Escala</h2>
      </div>

      {podePrevia && (
        <div className="filter-pills" style={{ marginBottom: 12 }}>
          <Link href="/escala" className={`pill${!previa ? " active" : ""}`}>Escala cadastrada</Link>
          {Object.entries(PREVIA).map(([k, v]) => (
            <Link key={k} href={`/escala?previa=${k}`} className={`pill${previa === k ? " active" : ""}`}>
              Prévia dez/2026 · {v.unidade}
            </Link>
          ))}
        </div>
      )}

      {previa ? (
        <div className="today-card" style={{ overflowX: "auto" }}>
          <p className="items-count" style={{ marginBottom: 12 }}>
            <strong>Lista provisória, só você vê.</strong> Vem da planilha de dezembro e não está cadastrada no sistema: não muda nenhum indicador nem aparece para as unidades. Nome em vermelho = vaga a contratar; 24, 25 e 31/12 a casa fica fechada e todos folgam.
          </p>
          <EscalaTabela
            mes={PREVIA_MES}
            hoje={hoje}
            unidade={PREVIA[previa].unidade}
            grupos={PREVIA[previa].grupos.map((g) => ({
              titulo: g.titulo,
              pessoas: g.pessoas.map((p, i) => ({
                key: i,
                nome: p.nome === "A CONTRATAR" ? "A contratar" : p.nome,
                aContratar: p.nome === "A CONTRATAR",
                funcao: p.funcao,
                folgas: new Set(p.folgas.map((d) => `${PREVIA_MES}-${String(d).padStart(2, "0")}`)),
              })),
            }))}
          />
        </div>
      ) : (
      <>
      {isGestor && <UnitFilter units={units} value={unitId} />}

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
        <Link className="btn-small" href={q(mesVizinho(mes, -1))}>‹ Anterior</Link>
        <strong style={{ minWidth: 140, textAlign: "center" }}>{MESES[m - 1]} de {ano}</strong>
        <Link className="btn-small" href={q(mesVizinho(mes, 1))}>Próximo ›</Link>
        {mes !== hoje.slice(0, 7) && <Link className="btn-tertiary" href={q(hoje.slice(0, 7))}>Mês atual</Link>}
      </div>

      {!escala || escala.pessoas.length === 0 ? (
        <div className="today-card"><p className="items-count">Nenhum gerente ou líder cadastrado nesta unidade.</p></div>
      ) : (
        <div className="today-card" style={{ overflowX: "auto" }}>
          <p className="items-count" style={{ marginBottom: 12 }}>
            {unitName ? `${unitName} · ` : ""}F = folga.
            {escala.vigenteDesde
              ? ` Até ${escala.vigenteDesde.split("-").reverse().join("/")} a folga é no domingo para todos; depois vale a escala de cada pessoa.`
              : " A folga é no domingo para todos."}
          </p>
          <EscalaTabela
            mes={mes}
            hoje={hoje}
            unidade={unitName ?? null}
            grupos={[{ titulo: null, pessoas: escala.pessoas.map((p) => ({ key: p.id, nome: p.name, funcao: p.funcao, folgas: p.folgas })) }]}
          />
        </div>
      )}
      </>
      )}
    </>
  );
}
