#!/usr/bin/env python3
"""
Verificare independentă, cu SymPy, a conținutului de clasa a II-a
(calcule, ecuații cu căsuțe, numere scrise cu litere, ora spusă românește).

    C2_EXPORT=/tmp/c2.json npx vitest run src/motor/clasa2
    python3 scripts/valideaza_clasa2.py /tmp/c2.json
"""
import json
import sys

from sympy import Eq, Integer, Symbol, solve, sympify

x, y = Symbol("x"), Symbol("y")

UNITATI = ["zero", "unu", "doi", "trei", "patru", "cinci", "șase", "șapte", "opt", "nouă", "zece",
           "unsprezece", "doisprezece", "treisprezece", "paisprezece", "cincisprezece", "șaisprezece",
           "șaptesprezece", "optsprezece", "nouăsprezece"]
ZECI = {2: "douăzeci", 3: "treizeci", 4: "patruzeci", 5: "cincizeci", 6: "șaizeci", 7: "șaptezeci", 8: "optzeci", 9: "nouăzeci"}


def litere(n: int) -> str:
    """Număr → cuvinte în română (0–1000), scris independent de aplicație."""
    if n == 1000:
        return "o mie"
    if n >= 100:
        s, r = divmod(n, 100)
        sute = "o sută" if s == 1 else ("două sute" if s == 2 else f"{UNITATI[s]} sute")
        return sute if r == 0 else f"{sute} {litere(r)}"
    if n < 20:
        return UNITATI[n]
    z, u = divmod(n, 10)
    return ZECI[z] if u == 0 else f"{ZECI[z]} și {UNITATI[u]}"


def ora(h: int, m: int) -> str:
    h = (h - 1) % 12 + 1
    return {0: f"ora {h}", 15: f"{h} și un sfert", 30: f"{h} și jumătate", 45: f"{h % 12 + 1} fără un sfert"}[m]


def s(e: str):
    return sympify(e, rational=True)


def verifica(v: dict) -> str | None:
    t = v["tip"]
    if t == "egal":
        return None if s(v["expr"]) == v["valoare"] else f"{v['expr']} = {s(v['expr'])}, nu {v['valoare']}"
    if t == "ecuatie":
        parti = [p.strip() for p in v["expr"].split(";")]
        for sol in v["solutii"]:
            subs = {x: Integer(sol[0])}
            if len(sol) > 1:
                subs[y] = Integer(sol[1])
            for p in parti:
                st, dr = p.split("=")
                if s(st).subs(subs) != s(dr).subs(subs):
                    return f"{p}: {sol} nu e soluție"
        if len(parti) == 1 and len(v["solutii"][0]) == 1:
            st, dr = parti[0].split("=")
            sol = solve(Eq(s(st), s(dr)), x)
            if sol != [Integer(v["solutii"][0][0])]:
                return f"{parti[0]}: SymPy {sol}"
        return None
    if t == "litere":
        return None if litere(v["n"]) == v["text"] else f"{v['n']}: „{v['text']}” ≠ „{litere(v['n'])}”"
    if t == "ora":
        return None if ora(v["ore"], v["minute"]) == v["text"] else f"ora {v['ore']}:{v['minute']} ≠ {v['text']}"
    if t == "compara":
        nums, val = v["numere"], v["valoare"]
        ok = (val == (max(nums) if v["mare"] else min(nums))) or sum(1 for n in nums if n % 2 == val % 2) == 1
        return None if ok else "comparare greșită"
    if t == "semn":
        a, b = s(v["st"]), s(v["dr"])
        semn = "<" if a < b else ">" if a > b else "="
        return None if semn == v["semn"] else f"{v['st']} {semn} {v['dr']}, generator {v['semn']}"
    if t == "bani":
        total = s(v["expr"])
        lei, bani = divmod(int(total), 100)
        def cu(n, sg, pl):
            return f"{n} {sg}" if n == 1 and sg == "ban" else ("1 leu" if n == 1 else f"{n} {'de ' if n % 100 >= 20 or n % 100 == 0 else ''}{pl}")
        txt = cu(bani, "ban", "bani") if not lei else (f"{cu(lei, 'leu', 'lei')} și {cu(bani, 'ban', 'bani')}" if bani else cu(lei, "leu", "lei"))
        return None if total == v["valoare"] and txt == v["text"] else f"bani: {v['expr']} = {total} „{txt}” ≠ „{v['text']}”"
    if t == "ordine":
        return None if len(set(v["valori"])) == len(v["valori"]) else "valori repetate la ordonare"
    if t == "fractie":
        return None if v["num"] == 1 and v["den"] in (2, 3, 4) else "fracție în afara programei"
    return None


def main() -> int:
    cale = sys.argv[1] if len(sys.argv) > 1 else "/tmp/c2.json"
    with open(cale, encoding="utf-8") as f:
        date = json.load(f)
    erori = [m for v in date if (m := verifica(v))]
    for m in erori[:20]:
        print("EROARE:", m)
    print(f"{len(date)} exerciții de clasa a II-a verificate cu SymPy, {len(erori)} erori.")
    return 1 if erori else 0


if __name__ == "__main__":
    sys.exit(main())
