import { BLOCURI_GOALE, CADRU_GOL, type Axa, type Blocuri, type Cadru, type ModelBara, type Rekenrek, type Tabla } from "./logica";

/** Starea oricărui manipulativ: aceeași formă în Atelier, în lecții și în linkurile de partajare. */
export type StareManip =
  | { tip: "blocuri"; v: Blocuri; faraSute?: boolean }
  | { tip: "rekenrek"; v: Rekenrek; randuri?: 1 | 2 }
  | { tip: "cadru"; v: Cadru; unSingurCadru?: boolean }
  | { tip: "axa"; v: Axa; moduri?: ("punct" | "salt")[] }
  | { tip: "tabla"; v: Tabla }
  | { tip: "bara"; v: ModelBara };

export type TipManip = StareManip["tip"];

export const MANIPULATIVE: { tip: TipManip; nume: string; icon: string; descriere: string }[] = [
  { tip: "blocuri", nume: "Blocuri baza 10", icon: "🧱", descriere: "Sute, zeci și unități; schimbi 10 pe 1." },
  { tip: "rekenrek", nume: "Rekenrek", icon: "🔴", descriere: "Două rânduri de 10 bile, câte 5 roșii și 5 albe." },
  { tip: "cadru", nume: "Cadrul de 10", icon: "🔲", descriere: "Jetoane în două culori; completezi până la 10." },
  { tip: "axa", nume: "Axa numerelor", icon: "📏", descriere: "Pui numere pe axă și faci salturi." },
  { tip: "tabla", nume: "Tabla sutelor", icon: "💯", descriere: "Colorezi tipare și găsești numere ascunse." },
  { tip: "bara", nume: "Modelul în bară", icon: "📊", descriere: "Desenezi problema cu bare (Singapore)." },
];

export function stareInitiala(tip: TipManip): StareManip {
  switch (tip) {
    case "blocuri":
      return { tip, v: BLOCURI_GOALE };
    case "rekenrek":
      return { tip, v: { sus: 0, jos: 0 } };
    case "cadru":
      return { tip, v: CADRU_GOL };
    case "axa":
      return { tip, v: { start: 0, sfarsit: 100, pas: 10, fin: 1, puncte: [], salturi: [] } };
    case "tabla":
      return { tip, v: { start: 1, colorate: {}, ascunse: [] } };
    case "bara":
      return {
        tip,
        v: { bare: [{ nume: "Întregul", segmente: [{ lungime: 5, eticheta: "" }, { lungime: 3, eticheta: "" }], total: "?" }] },
      };
  }
}

/** Codifică starea pentru un link (Atelier → „Copiază linkul”), ca la codurile de partajare. */
export function codifica(s: StareManip): string {
  const json = JSON.stringify(s);
  const b64 = btoa(Array.from(new TextEncoder().encode(json), (b) => String.fromCharCode(b)).join(""));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const TIPURI = new Set<string>(MANIPULATIVE.map((m) => m.tip));

export function decodifica(cod: string): StareManip | null {
  try {
    const b64 = cod.replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    const s = JSON.parse(json);
    if (!s || typeof s !== "object" || !TIPURI.has(s.tip) || typeof s.v !== "object" || s.v === null) return null;
    // completăm câmpurile lipsă din starea implicită, ca un link vechi sau scurtat să nu strice pagina
    const baza = stareInitiala(s.tip);
    return { ...baza, ...s, v: Array.isArray(baza.v) ? (Array.isArray(s.v) && s.v.length === 20 ? s.v : baza.v) : { ...baza.v, ...s.v } } as StareManip;
  } catch {
    return null;
  }
}
