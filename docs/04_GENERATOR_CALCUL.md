# Generatorul de calcul

Fișe de exerciții de calcul cu 5–200 de exerciții, pentru print (PDF cu barem, Word, CSV) și ca temă sau test online.

## 1. Ce am preluat din programele vechi (Soft-Pak: Math Maker / Math Master)

Am analizat fișierele de date (`.WPC`) și textele din executabile, fără să rulăm programele. Am preluat doar ideile pedagogice, nu conținutul. Categoriile găsite:

| Categorie veche | Niveluri și condiții | La noi |
|---|---|---|
| Adunare: fapte 1–6, 1–9; numere de 2, 3, 4 cifre; 3–4 termeni | orizontal / vertical (în coloană) | Adunare: interval, 2–4 termeni, cu/fără trecere peste ordin, în coloană |
| Scădere: fapte 1–6, 1–9; numărare înapoi; numere negative | rezultate pozitive sau negative | Scădere: cu/fără împrumut, rezultat ≥ 0 (negative doar la cerere) |
| Înmulțire: tabla „alege 1–9”, aleator 1–6/1–9, ×10/100/1000, completare (4 × _ = 36), în coloană (max. 9 × 99 … 99 × 9999) | orizontal / vertical | Înmulțire: tabla (alegi tablele) sau factori din interval, în coloană |
| Împărțire: fapte 1–12, aleator 1–3 … 1–9, împărțire lungă cu rest | exactă / cu rest | Împărțire: tabla sau interval; exactă, cu rest, amestecat |
| Operații în același exercițiu: add/sub/mul și toate 4, cu paranteze | ordinea operațiilor | Operații combinate: 2–3 operații, cu/fără paranteze (parantezele schimbă mereu rezultatul) |
| Completare (4 × _ = 36), număr lipsă | | Ecuații simple: aflarea termenului/factorului necunoscut (□, x, a, ?) |
| ×10/100/1000, rotunjiri, estimări | | Calcul mintal: ×/÷ 10, 100, 1000; zeci/sute întregi; dublu/jumătate; complementul până la 10/100/1000 |
| Fracții, zecimale, procente, bani, timp | | Acoperite de fișele pe lecții și de antrenament (fazele C și E) |
| Probleme cu enunț, nivelurile A/B/C (alegere multiplă, adevărat/fals) | | Acoperite de subiectele de probleme din antrenament |
| Seturi de 10 sau 20, cel mult 35 de copii, barem aliniat, cod de potrivire fișă–barem | | 5–200 de exerciții; cod de fișă comun pentru fișă, barem și tema online |

## 2. Cum funcționează

- Motor determinist: `src/motor/calcul/generator.ts`. Fiecare exercițiu depinde doar de (codul fișei, bloc, poziție, variantă), deci:
  - același cod dă aceleași exerciții pe fișă, pe barem și online;
  - butonul ↻ înlocuiește un singur exercițiu și nu le schimbă pe celelalte.
- Fără repetări în aceeași fișă cât timp intervalul permite. Dacă nu permite, fișa se completează și apare un avertisment cu numărul repetărilor.
- Exercițiile banale (cu 0, × 1, a − a) apar rar.
- Configurația (blocuri, interval, condiții, antet) încape în URL. Pagina de printare `/fisa/calcul` și PDF-ul (`/api/pdf-calcul`) o citesc de acolo, fără bază de date.
- Coloanele (2, 3 sau 4) se aleg automat după numărul și lățimea exercițiilor. Rândurile umplu prima pagină: fișele scurte au loc generos de scris.

## 3. Teme și teste online

- Profesorul trimite fișa unei grupe (clase) sau unui singur elev. Poate seta:
  - timp de lucru;
  - termen;
  - „test” (o singură trimitere);
  - „exerciții diferite pentru fiecare elev”.
- Elevul deschide tema din „Temele mele” sau cu codul primit.
  - Cronometrul se vede tot timpul. Când timpul expiră, tema se trimite automat.
  - Răspunsurile corecte nu ajung în pagina elevului; verificarea se face pe server.
- Profesorul vede la `/profesor/teme`:
  - cine a trimis;
  - scorul, timpul și numărul de încercări;
  - exercițiile cu cele mai multe greșeli.

## 4. Validare

```bash
npx vitest run src/motor/calcul
```

```bash
npm run valideaza:sympy
```

- Testele TypeScript generează peste 11 000 de exerciții pentru toate tipurile și combinațiile de condiții. Verifică:
  - rezultatul, recalculat independent;
  - intervalul;
  - trecerea peste ordin;
  - rezultatele nenegative;
  - împărțirea exactă sau cu rest;
  - unicitatea, determinismul și regenerarea individuală.
- Scriptul `scripts/valideaza_calcul.py` recalculează toate exercițiile cu SymPy (ecuațiile sunt rezolvate simbolic). Necesită `pip install sympy`.
