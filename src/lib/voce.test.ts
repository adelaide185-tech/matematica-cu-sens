import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SETARI_IMPLICITE, citesteSetari, salveazaSetari, spuneText, vociDisponibile } from "./voce";

type V = { name: string; lang: string };
let rostite: { text: string; rate: number; pitch: number; voice?: V }[] = [];
function browser(voci: V[]) {
  const mem: Record<string, string> = {};
  Object.assign(globalThis, {
    localStorage: { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } },
    speechSynthesis: { getVoices: () => voci, cancel: () => {}, speak: (u: { text: string; rate: number; pitch: number; voice?: V }) => rostite.push(u) },
    SpeechSynthesisUtterance: class { text: string; rate = 1; pitch = 1; lang = ""; voice?: V; constructor(t: string) { this.text = t; } },
  });
}
beforeEach(() => { rostite = []; });
afterEach(() => { for (const k of ["localStorage", "speechSynthesis", "SpeechSynthesisUtterance"]) delete (globalThis as Record<string, unknown>)[k]; });

describe("vocea jucăușă", () => {
  it("alege vocea de copil / feminină înaintea celor bărbătești (Edge)", () => {
    browser([{ name: "Microsoft Ryan Online (Natural) - English (United Kingdom)", lang: "en-GB" }, { name: "Microsoft George - English (United Kingdom)", lang: "en-GB" },
      { name: "Microsoft Maisie Online (Natural) - English (United Kingdom)", lang: "en-GB" }, { name: "Microsoft Andrei - Romanian (Romania)", lang: "ro-RO" }]);
    expect(vociDisponibile("en")[0].name).toMatch(/Maisie/);
    expect(vociDisponibile("en").length).toBe(3);
  });
  it("în Chrome: Google UK English Female înaintea lui Google UK English Male", () => {
    browser([{ name: "Google UK English Male", lang: "en-GB" }, { name: "Google US English", lang: "en-US" }, { name: "Google UK English Female", lang: "en-GB" }]);
    expect(vociDisponibile("en")[0].name).toBe("Google UK English Female");
    expect(vociDisponibile("en").at(-1)!.name).toBe("Google UK English Male");
  });
  it("vorbește rar și cu ton înalt; reglajele adultului se păstrează", () => {
    browser([{ name: "Google UK English Female", lang: "en-GB" }]);
    spuneText("Hello!");
    expect(rostite[0]).toMatchObject({ text: "Hello!", rate: SETARI_IMPLICITE.en.viteza, pitch: SETARI_IMPLICITE.en.ton });
    expect(SETARI_IMPLICITE.en.viteza).toBeLessThan(0.85);
    expect(SETARI_IMPLICITE.en.ton).toBeGreaterThan(1.2);
    salveazaSetari("en", { nume: null, viteza: 0.6, ton: 1.6 });
    expect(citesteSetari("en")).toEqual({ nume: null, viteza: 0.6, ton: 1.6 });
    spuneText("Cat");
    expect(rostite[1]).toMatchObject({ rate: 0.6, pitch: 1.6 });
  });
});
