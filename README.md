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

## Conturi și baza de date

- Cu o bază de date configurată (Vercel + Neon setează automat `DATABASE_URL`), aplicația cere autentificare.
- Fără bază de date rulează în **mod demonstrativ**: fișe și jocuri, fără conturi.
- **Variabile în Vercel → Settings → Environment Variables:**
  - `ADMIN_EMAILS`: emailurile administratorilor, separate prin virgulă. Obligatorie pentru prima configurare.
  - `AUTH_SECRET`: recomandată; un șir aleator lung.
- **Prima configurare:** pe `/configurare`, un email din `ADMIN_EMAILS` își alege parola.
- **Administratorul** (`/admin`):
  - creează clase și conturi de profesori;
  - importă elevi din CSV (`nume, prenume, email`);
  - primește parolele temporare ca CSV sau ca bilețele de printat;
  - poate reseta parolele.
- La prima intrare, fiecare utilizator își schimbă parola temporară.
- Progresul din jocuri se salvează în cont (`/api/progres`).
- Migrările Prisma rulează automat la fiecare build (`scripts/migreaza.mjs`).

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

Gata (etapa 2):
- conturi cu roluri (administrator, profesor, elev)
- import CSV al elevilor
- progres salvat în PostgreSQL

Gata (etapa 3, fazele A + B din `docs/03_PLAN_JOCURI.md`):
- **antrenament pe noțiuni** (`/elev/antrenament`): 28 de subiecte de numerație, operații și probleme (clasele I–IV)
- sesiuni de 10/20/50/100 exerciții unice; mod mixt cu mai multe subiecte amestecate
- indicii pas cu pas, pauză și reluare, ecran final cu verdict pe noțiune
- link direct pentru profesori: `/elev/antrenament?clasa=2&subiecte=op.tabla,op.impartire&nivel=mediu&n=50`

Urmează:
- fazele C–E: fracții, măsurări, timp, bani; geometrie și date; clasa a V-a
- teme cu cod pentru clasă și rapoarte de progres pentru profesor
- generatoare de geometrie și date
- clasa a V-a
