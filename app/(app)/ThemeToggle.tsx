"use client";

import { useSyncExternalStore } from "react";

type Tema = "system" | "light" | "dark";
const ROTULO: Record<Tema, string> = { system: "Tema: do aparelho", light: "Tema: claro", dark: "Tema: escuro" };
const PROXIMO: Record<Tema, Tema> = { system: "light", light: "dark", dark: "system" };
const EVENTO = "kenkyo-theme-change";

// O tema vive no atributo data-theme da página (posto antes de pintar pelo script do layout).
function lerTema(): Tema {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}
function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  return () => window.removeEventListener(EVENTO, aviso);
}

function aplicar(t: Tema) {
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  try {
    if (t === "system") localStorage.removeItem("kenkyo-theme");
    else localStorage.setItem("kenkyo-theme", t);
  } catch {
    /* sem armazenamento (janela privada): vale só até recarregar */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Alterna o tema: segue o aparelho → claro → escuro. A escolha fica neste navegador. */
export function ThemeToggle({ className }: { className?: string }) {
  const tema = useSyncExternalStore(assinar, lerTema, () => "system" as Tema);
  return (
    <button type="button" className={className} onClick={() => aplicar(PROXIMO[tema])}>
      {ROTULO[tema]}
    </button>
  );
}
