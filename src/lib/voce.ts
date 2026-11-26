"use client";

/**
 * Vocea aplicației (sinteza vocală a browserului), cu reglaje jucăușe pentru copii:
 * mai rar și mai înalt decât vocea implicită, și o voce feminină / de copil aleasă automat.
 * Părintele sau educatoarea poate alege altă voce și altă viteză (se păstrează în browser).
 */
export type LimbaVoce = "en" | "ro";
export interface SetariVoce { nume: string | null; viteza: number; ton: number }

const CHEIE = "mcs-voce";
export const SETARI_IMPLICITE: Record<LimbaVoce, SetariVoce> = {
  en: { nume: null, viteza: 0.72, ton: 1.35 },
  ro: { nume: null, viteza: 0.9, ton: 1.2 },
};
/** vocile jucăușe, în ordinea preferinței (Edge: vocile „Natural” de copil; Chrome, Safari, Android) */
const PREFERATE: Record<LimbaVoce, RegExp[]> = {
  en: [/Maisie/i, /\bAna\b.*English/i, /Libby/i, /Sonia/i, /Hazel/i, /Google UK English Female/i, /Serena|Kate|Martha|Stephanie/i, /Jenny|Aria|Michelle/i, /Samantha|Karen|Moira|Tessa|Fiona/i, /female/i],
  ro: [/Alina/i, /Ioana/i, /Google română/i, /Romanian/i],
};
const BARBATESTI = /male\b(?<!female)|Daniel|George|Arthur|Rishi|Ryan|Thomas|Oliver|Guy|Davis|Andrei|Emil|Fred|Alex\b/i;

const potriveste = (v: SpeechSynthesisVoice, l: LimbaVoce) => (l === "en" ? v.lang.toLowerCase().startsWith("en") : v.lang.toLowerCase().startsWith("ro"));

export function citesteSetari(l: LimbaVoce): SetariVoce {
  try {
    const s = JSON.parse(localStorage.getItem(CHEIE) ?? "{}")[l];
    if (s) return { nume: typeof s.nume === "string" ? s.nume : null, viteza: clamp(Number(s.viteza) || SETARI_IMPLICITE[l].viteza, 0.5, 1.2), ton: clamp(Number(s.ton) || SETARI_IMPLICITE[l].ton, 0.8, 1.8) };
  } catch {}
  return SETARI_IMPLICITE[l];
}
export function salveazaSetari(l: LimbaVoce, s: SetariVoce) {
  try {
    const toate = JSON.parse(localStorage.getItem(CHEIE) ?? "{}");
    localStorage.setItem(CHEIE, JSON.stringify({ ...toate, [l]: s }));
  } catch {}
}
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** vocile disponibile pentru limbă (cele jucăușe primele) */
export function vociDisponibile(l: LimbaVoce): SpeechSynthesisVoice[] {
  try {
    const v = speechSynthesis.getVoices().filter((x) => potriveste(x, l));
    const scor = (x: SpeechSynthesisVoice) => { const i = PREFERATE[l].findIndex((r) => r.test(x.name)); return (i < 0 ? 100 : i) + (BARBATESTI.test(x.name) ? 200 : 0) + (x.lang === (l === "en" ? "en-GB" : "ro-RO") ? 0 : 1); };
    return v.sort((a, b) => scor(a) - scor(b));
  } catch { return []; }
}

export function vocePentru(l: LimbaVoce, s = citesteSetari(l)): SpeechSynthesisVoice | null {
  const v = vociDisponibile(l);
  return (s.nume && v.find((x) => x.name === s.nume)) || v[0] || null;
}

/** Spune textul cu vocea jucăușă (oprește ce se spunea înainte). */
export function spuneText(text: string, l: LimbaVoce = "en", peste?: Partial<SetariVoce>) {
  try {
    const s = { ...citesteSetari(l), ...peste };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = l === "en" ? "en-GB" : "ro-RO";
    u.rate = s.viteza;
    u.pitch = s.ton;
    const v = vocePentru(l, s);
    if (v) { u.voice = v; u.lang = v.lang; }
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

/** Vocile se încarcă asincron în unele browsere: abonare la schimbare. */
export function laSchimbareaVocilor(f: () => void): () => void {
  try {
    speechSynthesis.addEventListener("voiceschanged", f);
    return () => speechSynthesis.removeEventListener("voiceschanged", f);
  } catch { return () => {}; }
}
