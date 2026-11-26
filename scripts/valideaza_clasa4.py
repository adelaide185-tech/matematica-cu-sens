#!/usr/bin/env python3
"""
Verificare independentă, cu SymPy, a exercițiilor de clasa a IV-a (semestrul al II-lea).

    C4_EXPORT=/tmp/c4.json npx vitest run src/motor/clasa4
    python3 scripts/valideaza_clasa4.py /tmp/c4.json

Faptele (corpuri, figuri, drepte, etaloane) sunt verificate cu tabele scrise separat aici,
iar numărările (așezări, strângeri de mână, ținute, numere) prin enumerare completă.
"""
import json
import sys
from itertools import combinations, permutations, product

from sympy import Eq, Integer, Rational, Symbol, solve, sympify

ROMANE = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]

# corp: (fețe, muchii, vârfuri, se rostogolește, nume)
CORPURI = {
    "cub": (6, 12, 8, False, "cub"),
    "cuboid": (6, 12, 8, False, "cuboid"),
    "piramida": (5, 8, 5, False, "piramidă"),
    "piramida-tri": (4, 6, 4, False, "piramidă triunghiulară"),
    "prisma-tri": (5, 9, 6, False, "prismă triunghiulară"),
    "cilindru": (None, None, None, True, "cilindru"),
    "con": (None, None, None, True, "con"),
    "sfera": (None, None, None, True, "sferă"),
}
PLANE = {
    "patrat": (4, "pătrat"), "dreptunghi": (4, "dreptunghi"), "triunghi": (3, "triunghi"), "romb": (4, "romb"),
    "paralelogram": (4, "paralelogram"), "trapez": (4, "trapez"), "cerc": (None, "cerc"), "pentagon": (5, "pentagon"), "hexagon": (6, "hexagon"),
}
# mărimea → unitatea potrivită și instrumentul
ETALOANE = {
    "furnica": ("mm", "rigla"), "creion": ("cm", "rigla"), "clasa": ("m", "ruleta"), "drum": ("km", "kilometrajul mașinii"),
    "elefant": ("t", "cântarul pentru camioane"), "mar": ("g", "cântarul de bucătărie"), "copil": ("kg", "cântarul de persoane"),
    "sirop": ("ml", "lingurița gradată"), "galeata": ("l", "vasul gradat"), "piscina": ("hl", "apometrul"),
    "pauza": ("minute", "ceasul"), "sprint": ("secunde", "cronometrul"),
}


def s(e: str):
    return sympify(e, rational=True)


def in_roman(n: int) -> str:
    r = ""
    for v, c in ROMANE:
        while n >= v:
            r += c
            n -= v
    return r


def rotunjeste(n: int, la: int) -> int:
    q, r = divmod(n, la)
    return (q + (1 if 2 * r >= la else 0)) * la


def fapt(v: dict):
    c, k, p = v["categorie"], v["cheie"], v["proprietate"]
    if c == "corp":
        f, m, vf, rost, nume = CORPURI[k]
        return {"fete": f, "muchii": m, "varfuri": vf, "rostogoleste": "da" if rost else "nu", "nume": nume}[p]
    if c == "plana":
        laturi, nume = PLANE[k]
        return {"laturi": laturi, "nume": nume}[p]
    if c == "drepte":
        u = int(k) % 180
        return "paralele" if u == 0 else "perpendiculare" if u == 90 else "concurente"
    if c == "etalon":
        u, i = ETALOANE[k]
        return {"unitate": u, "instrument": i}[p]
    raise ValueError(c)


def numarare(v: dict) -> int:
    f, n = v["fel"], v["n"]
    if f == "asezari":
        return sum(1 for _ in permutations(range(n)))
    if f == "perechi":
        return sum(1 for _ in combinations(range(n), 2))
    if f == "combinatii":
        return sum(1 for _ in product(range(n), range(v["m"])))
    if f == "numere":
        return len({10 * a + b for a, b in permutations(v["cifre"], 2) if a != 0})
    raise ValueError(f)


def verifica(v: dict, r: dict) -> str | None:
    t = v["tip"]
    valoare_r = r.get("valoare")
    pereche = r["tip"] == "pereche"  # la Memory, perechea se verifică în joc: aici verificăm doar faptul

    def acelasi(x) -> bool:
        return pereche or valoare_r == x
    if t == "egal":
        e = s(v["expr"])
        if e != v["valoare"] or not (e.is_integer and e >= 0):
            return f"{v['expr']} = {e}, nu {v['valoare']}"
        return None if r["tip"] != "numar" or acelasi(v["valoare"]) else "răspunsul diferă de verificare"
    if t == "comparatie":
        a, b = s(v["st"]), s(v["dr"])
        semn = "<" if a < b else ">" if a > b else "="
        return None if semn == v["semn"] and acelasi(semn) else f"{v['st']} {semn} {v['dr']}, generator {v['semn']}"
    if t == "perimetru":
        return None if sum(v["laturi"]) == v["valoare"] else "perimetru greșit"
    if t == "max":
        return None if max(v["numere"]) == v["valoare"] else "maxim greșit"
    if t == "construit":
        if r["tip"] != "construit" or r["perimetru"] != v["perimetru"]:
            return "perimetru construit"
        if r.get("laturi"):
            a, b = r["laturi"]
            return None if 2 * (a + b) == v["perimetru"] and a <= 12 and b <= 8 else f"laturi {a}×{b}"
        return None if v["perimetru"] % 2 == 0 and v["perimetru"] >= 6 else "nu există dreptunghi"
    if t == "secol":
        sec = (v["an"] - 1) // 100 + 1
        nume = "I" if sec == 1 else f"al {in_roman(sec)}-lea"
        return None if sec == v["valoare"] and acelasi(nume) else f"anul {v['an']}: secolul {nume}, generator {valoare_r}"
    if t == "sistem":
        simb = [Symbol(n) for n in v["necunoscute"]]
        ec = [Eq(s(e.split("=")[0]), s(e.split("=")[1])) for e in v["ecuatii"]]
        sol = solve(ec, simb, dict=True)
        if len(sol) != 1 or len(sol[0]) != len(simb):
            return f"sistemul nu are soluție unică: {v['ecuatii']}"
        if not all(x.is_integer and x >= 0 for x in sol[0].values()):
            return f"soluție nenaturală: {sol}"
        cer = s(v["cere"]).subs(sol[0])
        return None if cer == v["valoare"] and acelasi(cer) else f"{v['ecuatii']}: {v['cere']} = {cer}, generator {v['valoare']}"
    if t == "fapt" and v["proprietate"] == "rostogoleste":
        nume = {x[4]: k for k, x in CORPURI.items()}
        rost = [x for x in r["variante"] if CORPURI[nume[x]][3]]
        return None if rost == [valoare_r] == [CORPURI[v["cheie"]][4]] else f"rostogolire ambiguă: {r['variante']}"
    if t == "fapt":
        f = fapt(v)
        return None if f == v["valoare"] and (r["tip"] != "varianta" or valoare_r == f) and (r["tip"] != "numar" or valoare_r == f) else f"fapt {v}: corect {f}"
    if t == "eveniment":
        bile = dict(v["bile"])
        n, tot = bile.get(v["culoare"], 0), sum(bile.values())
        e = "imposibil" if n == 0 else "sigur" if n == tot else "posibil"
        return None if e == v["valoare"] and acelasi(e) else f"eveniment {v}: {e}"
    if t == "probabil":
        bile = v["bile"]
        mx = max(x for _, x in bile)
        castig = [c for c, x in bile if x == mx]
        if len(castig) != 1:
            return "mai multe culori la egalitate"
        sg = {"roșii": "roșie", "albastre": "albastră", "verzi": "verde", "galbene": "galbenă"}[castig[0]]
        return None if sg == v["valoare"] and acelasi(sg) else f"probabil {v}"
    if t == "numarare":
        n = numarare(v)
        return None if n == v["valoare"] and acelasi(n) else f"numărare {v}: {n}"
    if t == "estimare":
        a, b = v["numere"]
        if v["op"] == "*":
            e = rotunjeste(a, v["la"]) * b
        else:
            ra, rb = rotunjeste(a, v["la"]), rotunjeste(b, v["la"])
            e = ra + rb if v["op"] == "+" else ra - rb
        ok_r = pereche or (valoare_r == e if r["tip"] == "numar" else valoare_r.replace(" ", "") == str(e))
        return None if e == v["valoare"] and ok_r else f"estimare {v}: {e}"
    return f"tip necunoscut {t}"


def main() -> int:
    cale = sys.argv[1] if len(sys.argv) > 1 else "/tmp/c4.json"
    with open(cale, encoding="utf-8") as f:
        date = json.load(f)
    erori = [f"{m} — {d['text']}" for d in date if (m := verifica(d["v"], d["r"]))]
    for m in erori[:20]:
        print("EROARE:", m)
    tipuri = sorted({d["v"]["tip"] for d in date})
    print(f"{len(date)} exerciții de clasa a IV-a verificate ({', '.join(tipuri)}), {len(erori)} erori.")
    return 1 if erori else 0


if __name__ == "__main__":
    sys.exit(main())
