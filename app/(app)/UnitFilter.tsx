"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function UnitFilter({
  units,
  value,
}: {
  units: { id: number; name: string }[];
  value: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value) {
      params.set("unit", event.target.value);
    } else {
      params.delete("unit");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="form-group" style={{ maxWidth: 280 }}>
      <label htmlFor="unitFilter">Unidade</label>
      <select
        id="unitFilter"
        defaultValue={value ?? ""}
        onChange={handleChange}
      >
        <option value="">Todas as unidades</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
