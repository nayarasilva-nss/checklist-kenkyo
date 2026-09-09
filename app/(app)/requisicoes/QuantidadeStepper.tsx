"use client";

function stepFor(unidade: string) {
  return unidade === "kg" || unidade === "L" ? 0.5 : 1;
}

/** −/input/+ stepper so adding a quantity on mobile doesn't require
 * tapping into the field and typing — matches native app quantity
 * pickers, with big enough touch targets to use with a thumb. */
export function QuantidadeStepper({
  value,
  unidade,
  onChange,
  name,
}: {
  value: number;
  unidade: string;
  onChange: (value: number) => void;
  /** Set for an uncontrolled field (e.g. inside a plain <form> submit) instead of a controlled one. */
  name?: string;
}) {
  const step = stepFor(unidade);

  function round(v: number) {
    return Math.round(v * 100) / 100;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        onClick={() => onChange(round(Math.max(0, value - step)))}
        aria-label={`Diminuir quantidade de ${unidade}`}
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 7,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        −
      </button>
      <input
        type="number"
        name={name}
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        style={{ width: 52, textAlign: "center", fontSize: 16, flexShrink: 0 }}
      />
      <button
        type="button"
        onClick={() => onChange(round(value + step))}
        aria-label={`Aumentar quantidade de ${unidade}`}
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 7,
          border: "1px solid var(--kenkyo-red)",
          background: "var(--kenkyo-red)",
          color: "#fff",
          fontSize: 16,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        +
      </button>
      <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{unidade}</span>
    </div>
  );
}
