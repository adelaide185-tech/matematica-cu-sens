#!/usr/bin/env python3
"""
Verificare independentă a generatorului de calcul, cu SymPy.

Exportă exercițiile din testele TypeScript și le recalculează simbolic:
    CALCUL_EXPORT=/tmp/calcul.json npx vitest run src/motor/calcul
    python3 scripts/valideaza_calcul.py /tmp/calcul.json

Necesită: pip install sympy
"""
import json
import sys

from sympy import Eq, Integer, Rational, Symbol, solve, sympify

x = Symbol("x")


def numar(expr: str):
    # numerele întregi exacte: împărțirea dă Rational, nu float
    return sympify(expr, rational=True)


def verifica(e: dict) -> str | None:
    r = e["raspuns"]
    expr = e["expresie"]
    if "=" in expr:
        st, dr = expr.split("=")
        sol = solve(Eq(numar(st), numar(dr)), x)
        if r["tip"] != "numar" or sol != [Integer(r["valoare"])]:
            return f"ecuația {expr}: SymPy dă {sol}, generatorul {r}"
        return None
    v = numar(expr)
    if r["tip"] == "rest":
        n, d = (Integer(t) for t in expr.split("/"))
        if not (n == r["cat"] * d + r["rest"] and 0 < r["rest"] < d):
            return f"{expr}: cât {r['cat']} rest {r['rest']} greșit"
        if v != Rational(n, d):
            return f"{expr}: împărțire citită greșit"
        return None
    if not v.is_integer or v != r["valoare"]:
        return f"{expr} = {v}, generatorul spune {r['valoare']}"
    return None


def main() -> int:
    cale = sys.argv[1] if len(sys.argv) > 1 else "/tmp/calcul.json"
    with open(cale, encoding="utf-8") as f:
        exercitii = json.load(f)
    erori = [m for e in exercitii if (m := verifica(e))]
    for m in erori[:20]:
        print("EROARE:", m)
    print(f"{len(exercitii)} exerciții verificate cu SymPy, {len(erori)} erori.")
    return 1 if erori else 0


if __name__ == "__main__":
    sys.exit(main())
