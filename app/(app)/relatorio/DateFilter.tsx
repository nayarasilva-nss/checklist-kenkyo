"use client";

export function DateFilter({
  date,
  unit,
}: {
  date: string;
  unit?: string;
}) {
  return (
    <form action="/relatorio">
      {unit && <input type="hidden" name="unit" value={unit} />}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="reportDateFilter">Data:</label>
        <input
          type="date"
          id="reportDateFilter"
          name="date"
          defaultValue={date}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </div>
    </form>
  );
}
