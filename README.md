# Matematică cu Sens · Fabrica de Inteligență

Aplicație web pentru profesorii și elevii claselor I–V: generator de fișe de lucru (4 niveluri, PDF elev + PDF cu rezolvări și barem) și jocuri interactive de matematică, aliniate cu programa școlară din România.

## Pornire locală

```bash
npm install
```

```bash
npm run dev
```

Aplicația pornește la http://localhost:3000.

- `/profesor`: generatorul de fișe
- `/elev`: jocurile (Scara, Numărătoarea magică, Pizza fracțiilor)
- `/fisa?...`: pagina A4 de printare
- `/api/pdf?...`: descărcare PDF (are nevoie de Playwright + Chromium pe server)

## Teste

```bash
npm test
```

Testele verifică fiecare generator, pentru fiecare clasă și fiecare nivel, pe 150 de seed-uri: rezultatele calculelor, împărțirea cu rest, scrierea numerelor cu litere, cifrele romane, reproductibilitatea fișelor și existența generatoarelor din curriculum.

## Structură

| Folder | Conținut |
|---|---|
| `src/motor/` | motorul de exerciții: `rng.ts` (seed reproductibil), `tipuri.ts`, `limba.ts` (numere în litere, acordul cu „de”), `barem.ts` (FB/B/S/I, note), `fisa.ts` (compunerea fișelor), `generatoare/*` |
| `src/curriculum/` | mapa curriculară: lecțiile Eduten (cl. I, III, IV), curriculumul „Matematică cu Sens” (cl. II), programa (cl. V) |
| `src/componente/svg/` | desenele SVG comune fișelor și jocurilor: numărătoare, fracții, ceas, axa numerelor |
| `src/componente/FisaPrint.tsx` | fișa A4 (antet, itemi, spațiu de lucru, rezolvări, barem) |
| `src/jocuri/` | progres, dificultate adaptivă, recompense, componente comune jocurilor |
| `src/app/` | paginile Next.js |
| `prisma/schema.prisma` | schema bazei de date (conturi, școli, licențe, teme, progres); încă neconectată |
| `docs/` | arhitectura și mapa curriculară |

## Stadiu

Gata și testat:
- 28 de generatoare
- fișe pe 4 niveluri cu barem și descriptori
- PDF
- 3 jocuri cu stele, trofee și dificultate adaptivă

Urmează:
- conturi (autentificare email + parolă, import CSV elevi) și baza de date PostgreSQL
- teme cu cod pentru clasă
- generatoare de geometrie și date
- clasa a V-a
