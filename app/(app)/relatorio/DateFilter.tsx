"use client";

export function DateFilter({ date }: { date: string }) {
  return (
    <form action="/relatorio">
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
