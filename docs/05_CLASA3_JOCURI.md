# Clasa a III-a: teme și mini-jocuri

Profesorul alege la `/profesor/clasa3`:
- unul sau mai multe capitole din programă, fiecare cu opțiunile lui;
- jocul;
- numărul de exerciții: 10, 15, 20, 25, 50 sau 100.

Aceleași exerciții apar pe fișa PDF (cu barem pe pagină separată) și în jocul online. Profesorul poate trimite jocul unei grupe sau unui elev.

## Capitole și opțiuni

| Capitol | Opțiuni |
|---|---|
| Numerele naturale 0 – 10 000 | scriere/citire, descompunere, comparare, ordonare, rotunjire la zeci/sute/mii, cifre romane |
| Adunarea și scăderea 0 – 10 000 | fără / cu trecere peste ordin; aflarea termenului necunoscut |
| Înmulțirea 0 – 10 000 | tabla, × 10/100/1 000, 2–3 cifre × o cifră (cu/fără trecere), 2 cifre × 2 cifre, proprietăți |
| Împărțirea 0 – 1 000 | tabla, 2–3 cifre : o cifră; exactă / cu rest (D = Î × C + R, R < Î) |
| Ordinea operațiilor | fără / cu paranteze rotunde |
| Fracții | scriere și citire, reprezentare, comparare, subunitare/echiunitare/supraunitare, fracție dintr-un întreg |
| Geometrie și unități de măsură | perimetru (pătrat, dreptunghi, triunghi), lungime, capacitate, masă, timp, bani |
| Probleme cu 2–3 operații | metoda figurativă, metoda mersului invers |

## Cele 5 jocuri (`src/jocuri/c3/JocC3.tsx`)

| Joc | Ce face elevul |
|---|---|
| ⏱️ Cursa contra cronometrului | Răspunde înainte să se golească bara de timp (viteză: lent 20 s / mediu 12 s / rapid 7 s). Bara accelerează după fiecare 3 răspunsuri corecte la rând. |
| 🃏 Perechi matematice | Memory cu table de câte 6 perechi: calcul ↔ rezultat, cifre romane ↔ număr, desen ↔ fracție, mărimi ↔ unități. |
| ⚖️ Balanța expresiilor | Compară două expresii, numere, fracții sau mărimi cu <, = sau >. Balanța se înclină după răspuns. |
| 🔍 Detectivul numerelor | Găsește numărul lipsă („48 : □ + 15 = 23”) sau parantezele care dau rezultatul cerut (o singură variantă corectă). |
| 🏗️ Constructorul | Construiește pe grilă un dreptunghi cu perimetrul sau laturile date, calculează perimetre și colorează fracții. |

Comun tuturor jocurilor:
- bara de progres, punctajul, combo-ul 🔥 și viețile (0, 3 sau 5);
- indiciu după o greșeală; a doua încercare valorează jumătate din puncte;
- butonul 🔊, care citește enunțul;
- „Mai încerc o dată” aduce exerciții noi de același tip.

**Punctaj:** 10 puncte din prima încercare, 5 din a doua. Bonusuri:
- combo: +1 de la 3 răspunsuri corecte la rând, +2 de la 5, +3 de la 10;
- viteză: +2 la Sprint, pentru un răspuns dat în mai puțin de jumătate din timp.

**Medalii:** 🥉 ≥ 50%, 🥈 ≥ 75%, 🥇 ≥ 90%, 💎 toate corecte din prima.

## Rezultate pentru profesor (`/profesor/teme/[id]`)

Pagina se actualizează automat la 10 secunde. Pentru fiecare elev arată:
- medalia, scorul, combo-ul și acuratețea;
- timpul total și timpul mediu pe exercițiu;
- numărul de încercări;
- lista exercițiilor greșite, cu răspunsul dat.

Mai arată și procentul de răspunsuri corecte pe fiecare capitol și exercițiile cu cele mai multe greșeli (cu răspunsul greșit cel mai frecvent). Serverul regenerează exercițiile și verifică din nou fiecare răspuns.

## Validare

```bash
npx vitest run src/motor/clasa3
```

```bash
npm run valideaza:sympy
```

Testele generează 8 000 de exerciții (5 jocuri × 8 capitole) și verifică independent:
- rezultatul;
- împărțirile exacte (rest 0) și cele cu rest (0 < R < Î, D = Î × C + R);
- rezultatele parțiale și finale naturale la ordinea operațiilor;
- că numărul lipsă este unic și că doar o așezare a parantezelor dă rezultatul;
- că nu există duplicate în sesiune sau pe fișă, iar la Memory nu se repetă nici fețele;
- cifrele romane și opțiunile alese de profesor.

`scripts/valideaza_clasa3.py` le recalculează cu SymPy.
