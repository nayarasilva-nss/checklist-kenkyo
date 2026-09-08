"use client";

import { updateCoveringUnit } from "@/lib/actions/covering-unit";

export function CoveringUnitBanner({
  units,
  homeUnitId,
  covering,
}: {
  units: { id: number; name: string }[];
  homeUnitId: number | null;
  covering: { unitId: number; unitName: string } | null;
}) {
  return (
    <form action={updateCoveringUnit} className="covering-unit-banner">
      <span className="covering-unit-label">
        {covering ? (
          <>
            Cobrindo <strong>{covering.unitName}</strong> hoje
          </>
        ) : (
          "Unidade de hoje"
        )}
      </span>
      <select
        name="unitId"
        defaultValue={covering ? covering.unitId : (homeUnitId ?? "")}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Unidade de hoje"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.id === homeUnitId ? `${u.name} (minha unidade)` : u.name}
          </option>
        ))}
      </select>
    </form>
  );
}
