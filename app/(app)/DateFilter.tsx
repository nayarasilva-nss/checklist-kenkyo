"use client";

export function DateFilter({
  date,
  unit,
  action,
}: {
  date: string;
  unit?: string;
  action: string;
}) {
  return (
    <form action={action}>
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
