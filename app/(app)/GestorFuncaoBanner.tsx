"use client";

import { updateGestorFuncao } from "@/lib/actions/gestor-funcao";

export function GestorFuncaoBanner({
  jobFunctions,
  atuando,
}: {
  jobFunctions: { id: number; name: string }[];
  atuando: { jobFunctionId: number; jobFunctionName: string } | null;
}) {
  return (
    <form action={updateGestorFuncao} className="covering-unit-banner">
      <span className="covering-unit-label">
        {atuando ? (
          <>
            Atuando como <strong>{atuando.jobFunctionName}</strong> hoje
          </>
        ) : (
          "Função de hoje"
        )}
      </span>
      <select
        name="jobFunctionId"
        defaultValue={atuando?.jobFunctionId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Função de hoje"
      >
        <option value="">Sem trabalho operacional hoje</option>
        {jobFunctions.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </form>
  );
}
