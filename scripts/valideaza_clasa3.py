#!/usr/bin/env python3
"""
Verificare independentă, cu SymPy, a exercițiilor de clasa a III-a.

    C3_EXPORT=/tmp/c3.json npx vitest run src/motor/clasa3
    python3 scripts/valideaza_clasa3.py /tmp/c3.json
"""
import json
import sys

from sympy import Eq, Integer, Rational, Symbol, solve, sympify

x = Symbol("x")
ROMANE = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def s(e: str):
    return sympify(e, rational=True)


def natural_pe_parcurs(expr: str) -> bool:
    """Toate subexpresiile (deci toate rezultatele parțiale) sunt numere naturale."""
    def ok(n):
        if n.is_Number:
            return n.is_integer and n >= 0
        return all(ok(a) for a in n.args) and n.is_integer and n >= 0
    return ok(s(expr))


def din_roman(r: str) -> int:
    t = 0
    for i, c in enumerate(r):
        v = ROMANE[c]
        t += -v if i + 1 < len(r) and v < ROMANE[r[i + 1]] else v
    return t


def verifica(v: dict) -> str | None:
    t = v["tip"]
    if t == "egal":
        return None if s(v["expr"]) == v["valoare"] else f"{v['expr']} = {s(v['expr'])}, nu {v['valoare']}"
    if t == "ecuatie":
        st, dr = v["expr"].split(" = ")
        sol = solve(Eq(s(st), s(dr)), x)
        return None if sol == [Integer(v["valoare"])] else f"{v['expr']}: SymPy {sol}, generator {v['valoare']}"
    if t == "rest":
        ok = v["d"] == v["i"] * v["c"] + v["r"] and 0 < v["r"] < v["i"]
        return None if ok else f"D = Î × C + R greșit: {v}"
    if t == "comparatie":
        a, b = s(v["st"]), s(v["dr"])
        semn = "<" if a < b else ">" if a > b else "="
        return None if semn == v["semn"] else f"{v['st']} {semn} {v['dr']}, generator {v['semn']}"
    if t == "roman":
        return None if din_roman(v["roman"]) == v["valoare"] else f"{v['roman']} ≠ {v['valoare']}"
    if t == "clasa-fractie":
        f = Rational(v["num"], v["den"])
        c = "subunitară" if f < 1 else "echiunitară" if f == 1 else "supraunitară"
        return None if c == v["clasa"] else f"{v['num']}/{v['den']} e {c}"
    if t == "max":
        return None if max(v["numere"]) == v["valoare"] else "maxim greșit"
    if t == "paranteze":
        if s(v["expr"]) != v["tinta"] or not natural_pe_parcurs(v["expr"]):
            return f"{v['expr']} ≠ {v['tinta']}"
        return None if all(s(e) != v["tinta"] for e in v["altele"]) else "răspuns ambiguu"
    if t == "perimetru":
        return None if sum(v["laturi"]) == v["valoare"] else "perimetru greșit"
    return None  # fracție, construit, colorare: verificate structural în teste


def main() -> int:
    cale = sys.argv[1] if len(sys.argv) > 1 else "/tmp/c3.json"
    with open(cale, encoding="utf-8") as f:
        date = json.load(f)
    erori = [m for v in date if (m := verifica(v))]
    for m in erori[:20]:
        print("EROARE:", m)
    print(f"{len(date)} exerciții de clasa a III-a verificate cu SymPy, {len(erori)} erori.")
    return 1 if erori else 0


if __name__ == "__main__":
    sys.exit(main())
