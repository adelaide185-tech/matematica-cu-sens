"use client";

/** Efecte sonore scurte, generate în browser (fără fișiere): pop, boing, tada, rotire, deschidere. */
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try { ctx ??= new AudioContext(); if (ctx.state === "suspended") void ctx.resume(); return ctx; } catch { return null; }
}
function ton(frecventa: number, durata: number, tip: OscillatorType = "sine", volum = 0.08, panta?: number, intarziere = 0) {
  const c = audio(); if (!c) return;
  const t = c.currentTime + intarziere;
  const o = c.createOscillator(), g = c.createGain();
  o.type = tip; o.frequency.setValueAtTime(frecventa, t);
  if (panta) o.frequency.exponentialRampToValueAtTime(panta, t + durata);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(volum, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + durata + 0.02);
}
export const sunet = {
  pop: () => { ton(900, 0.09, "triangle", 0.12, 300); },
  bonk: () => { ton(320, 0.12, "square", 0.05, 140); ton(660, 0.1, "triangle", 0.06, 900, 0.05); },
  boing: () => { ton(220, 0.35, "sine", 0.07, 520); },
  corect: () => { ton(660, 0.12, "triangle", 0.08); ton(880, 0.18, "triangle", 0.08, undefined, 0.1); },
  tada: () => { [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.22, "triangle", 0.07, undefined, i * 0.11)); },
  rotire: () => { for (let i = 0; i < 10; i++) ton(700 + (i % 2) * 120, 0.04, "square", 0.025, undefined, i * 0.09 * (1 + i / 12)); },
  deschide: () => { ton(400, 0.25, "sine", 0.07, 1200); },
  clic: () => { ton(1200, 0.04, "square", 0.03); },
};
