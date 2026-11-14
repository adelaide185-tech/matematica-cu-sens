"use client";

import { useEffect, useRef } from "react";
import type { Transition } from "framer-motion";

/**
 * Reguli de mișcare pentru jocuri (tabletă și tablă interactivă):
 * animații scurte, 300–500 ms, care explică ceva (o bilă care se mută, o zece care se formează),
 * niciodată decor care distrage. Cine a cerut „mișcare redusă” primește tranziții instant.
 */
export const DURATA = { scurt: 0.3, mediu: 0.4, lung: 0.5 } as const;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const tranzitie = (d: keyof typeof DURATA = "mediu", delay = 0): Transition => ({ duration: DURATA[d], ease: EASE, delay });

/** Întârziere pentru apariții „una câte una” (numărare vizuală), plafonată ca întregul să rămână sub 0,5 s. */
export const pas = (i: number, n: number) => Math.min(i * 0.04, (0.5 - DURATA.scurt) * (i / Math.max(1, n - 1)));

const CULORI = ["#6a59a7", "#f9c50f", "#2e9e5b", "#2f6fd1", "#e07a1f"];

/** Ploaie scurtă de confetti la finalul sesiunii (se încarcă doar atunci, nu la pornirea jocului). */
export async function celebreaza(intensitate: "mica" | "mare" = "mare") {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const baza = { colors: CULORI, disableForReducedMotion: true, zIndex: 50, ticks: 160, scalar: 1.1 };
  const n = intensitate === "mare" ? 90 : 45;
  confetti({ ...baza, particleCount: n, spread: 75, startVelocity: 42, origin: { x: 0.2, y: 0.75 }, angle: 60 });
  confetti({ ...baza, particleCount: n, spread: 75, startVelocity: 42, origin: { x: 0.8, y: 0.75 }, angle: 120 });
}

/** Declanșează celebrarea o singură dată, la montarea ecranului de final. */
export function useCelebrare(activ: boolean, intensitate: "mica" | "mare" = "mare") {
  const facut = useRef(false);
  useEffect(() => {
    if (!activ || facut.current) return;
    facut.current = true;
    celebreaza(intensitate);
  }, [activ, intensitate]);
}
