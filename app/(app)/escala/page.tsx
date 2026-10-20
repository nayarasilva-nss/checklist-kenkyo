import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { isGestorProfile } from "@/lib/auth/profile";
import { canVerEscala } from "@/lib/auth/escala";
import { getEscalaMes } from "@/lib/data/escala";
import { getUnits } from "@/lib/data/units";
import { checklistDayISO } from "@/lib/date-utils";
import { UnitFilter } from "../UnitFilter";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIA = ["D", "S", "T", "Q", "Q", "S", "S"];

function mesVizinho(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function EscalaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; unit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!canVerEscala(user)) redirect("/hoje");

  const { mes: rawMes, unit: rawUnit } = await searchParams;
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
          <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 12px 4px 0", position: "sticky", left: 0, background: "var(--bg, #fff)" }}>Pessoa</th>
                {escala.dias.map((d) => (
                  <th key={d.date} style={{ padding: "2px 4px", textAlign: "center", minWidth: 26, color: d.date === hoje ? "var(--kenkyo-red)" : undefined, borderBottom: d.date === hoje ? "2px solid var(--kenkyo-red)" : undefined }}>
                    <div style={{ fontWeight: 400, fontSize: 11 }}>{DIA[d.dow]}</div>
                    <div>{Number(d.date.slice(8))}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {escala.pessoas.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border, #e5e5e5)" }}>
                  <td style={{ padding: "6px 12px 6px 0", whiteSpace: "nowrap", position: "sticky", left: 0, background: "var(--bg, #fff)" }}>
                    <strong>{p.name}</strong>
                    {p.funcao && <div className="items-count">{p.funcao}</div>}
                  </td>
                  {escala.dias.map((d) => (
                    <td key={d.date} style={{ textAlign: "center", padding: 2 }}>
                      {p.folgas.has(d.date) ? (
                        <span className="badge badge-warning" style={{ padding: "2px 5px" }}>F</span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
