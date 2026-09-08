"use client";

export function ImprimirButton() {
  return (
    <button type="button" className="btn-pdf no-print" onClick={() => window.print()}>
      📥 Salvar como PDF
    </button>
  );
}
