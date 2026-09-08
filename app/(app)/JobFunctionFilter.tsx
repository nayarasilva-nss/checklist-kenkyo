"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function JobFunctionFilter({
  jobFunctions,
  value,
}: {
  jobFunctions: { id: number; name: string }[];
  value: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value) {
      params.set("funcao", event.target.value);
    } else {
      params.delete("funcao");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="form-group" style={{ maxWidth: 280 }}>
      <label htmlFor="jobFunctionFilter">Função</label>
      <select id="jobFunctionFilter" defaultValue={value ?? ""} onChange={handleChange}>
        <option value="">Todas as funções</option>
        {jobFunctions.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
