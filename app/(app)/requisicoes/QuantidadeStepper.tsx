"use client";

import { useState } from "react";

function stepFor(unidade: string) {
  return unidade === "kg" || unidade === "L" ? 0.5 : 1;
}

// pt-BR usa vírgula como separador decimal, mas <input type="number">
// só aceita ponto — no teclado numérico do celular, a tecla de vírgula
// simplesmente não digita nada nesse tipo de campo. Um <input type="text">
// com inputMode="decimal" ainda traz o teclado numérico, só que aceitando
// os dois separadores.
function toDisplay(v: number) {
  return String(v).replace(".", ",");
}

function parseDecimal(raw: string): number | null {
  if (!/^\d*[.,]?\d*$/.test(raw)) return null;
  if (raw === "" || raw === "," || raw === ".") return 0;
  const num = Number(raw.replace(",", "."));
  return Number.isFinite(num) ? num : null;
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
  const [text, setText] = useState(toDisplay(value));
  const [prevValue, setPrevValue] = useState(value);

  // Mantém o campo em sincronia quando o valor muda por fora (os botões
  // −/+, ou o pai resetando o formulário) sem sobrescrever o que a
  // pessoa está digitando no meio de um "0,1" → "0,10". Ajuste durante o
  // render em vez de um efeito — https://react.dev/learn/you-might-not-need-an-effect
  if (value !== prevValue && parseDecimal(text) !== value) {
    setPrevValue(value);
    setText(toDisplay(value));
  } else if (value !== prevValue) {
    setPrevValue(value);
  }

  function round(v: number) {
    return Math.round(v * 1000) / 1000;
  }

  function handleTextChange(raw: string) {
    const parsed = parseDecimal(raw);
    if (parsed === null) return;
    setText(raw);
    onChange(Math.max(0, parsed));
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
        type="text"
        inputMode="decimal"
        name={name}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={() => setText(toDisplay(value))}
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
