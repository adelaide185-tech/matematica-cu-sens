# Reguli de UX pentru jocuri (tabletă și tablă interactivă)

Stack: **Tailwind CSS** pentru stil, **framer-motion** pentru animații și drag-and-drop, **canvas-confetti** pentru celebrarea de la finalul sesiunii.

| Regulă | Cum e aplicată |
|---|---|
| Ținte mari, min. 64 px | token `--spacing-tinta` → clasele `h-tinta`, `w-tinta`, `min-h-tinta`, `min-w-tinta` |
| Font cu diacritice românești complete | Nunito (`latin-ext`), pus pe toată zona elev în `src/app/elev/layout.tsx` |
| Cifre aliniate | `tabular-nums` pe toată zona elev |
| Fundal cald, anti-oboseală | `bg-crem` (#fbf4e6) pentru fundal, `bg-hartie` pentru carduri, text `text-cerneala`; fără alb pur pe suprafețe mari |
| Zero aglomerație pe ecranul de joc | bara de cont apare doar în meniuri (`src/app/elev/(meniu)/layout.tsx`); în joc rămân doar ieșirea, titlul și progresul |
| Animații scurte, 300–500 ms, care explică | `src/jocuri/miscare.ts`: `DURATA`, `tranzitie()`, `pas()`; folosiți-le, nu durate scrise de mână |
| Mișcare redusă | `useReducedMotion()` în componente, iar confetti-ul nu pornește dacă sistemul cere mișcare redusă |

Animații conceptuale existente:
- **Formarea zecii** (`src/jocuri/NumaratoareAnimata.tsx`): a 10-a bilă pe o tijă, apoi cele 10 bile alunecă spre tija din stânga și devin una („10 unități = 1 zece”).
- **Cadrul de 10**: bulinele intră una câte una, întâi primul termen, apoi cele care completează zecea.
- **Grupe egale / matrice**: grupele apar pe rând, rândurile matricei la fel.
- **Blocuri baza 10**: fiecare bloc nou „cade” la locul lui.

Înainte de push: verificare vizuală pe iPad (820×1180, 1180×820) și pe desktop/tablă (1920×1080).
