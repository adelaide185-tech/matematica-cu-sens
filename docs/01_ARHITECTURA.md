# Matematică cu Sens — Arhitectura aplicației (Pasul 2)

## 1. Stack tehnic

| Strat | Alegere | De ce |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Același cod pentru panoul profesorului, zona elevului și API; găzduire simplă pe Vercel |
| UI | **Tailwind CSS** + componente proprii (shadcn/ui pentru formulare) | Rapid, consistent, ușor de întreținut |
| Animații | **Framer Motion** | Feedback fluid în jocuri (stele, confetti, tranziții) |
| Bază de date | **PostgreSQL** (Neon) în producție și pentru dezvoltare (o ramură Neon separată); ORM **Prisma** | Gratuit la început, scalează la plata per cont; Postgres permite câmpuri listă (`String[]`) și JSON, pe care SQLite nu le are |
| Autentificare | **Auth.js (NextAuth v5)**, email + parolă (bcrypt) | Elevii au conturi Proton Mail create de școală; fără dependență de Google |
| PDF | **Print CSS + Playwright (Chromium)** pe server | Aceleași componente React/SVG pe ecran și în PDF → ceasuri, axe, fracții identice |
| Teste | **Vitest** (generatoare: corectitudine matematică) + **Playwright** (fluxuri) | Fiecare generator testat pe 1.000 de seed-uri |
| Găzduire | **Vercel** (aplicație) + **Neon** (Postgres) | Fără server de administrat |

## 2. Principiul central: un singur motor de itemi

```
             ┌──────────────────────────────┐
             │   MOTOR DE GENERARE (pur TS)  │
             │  generator(seed, nivel, opț.) │──► Item (date + răspuns + rezolvare)
             └──────────────┬───────────────┘
                            │ același Item
        ┌───────────────────┼────────────────────┐
        ▼                   ▼                    ▼
  Fișă PDF elev     Fișă PDF rezolvări+barem   Joc interactiv
 (spațiu de lucru)  (pași „Ce știu/Ce caut/…”) (input, drag, alegere)
```

- **Seed reproductibil**: o fișă = `{config, seed}`. Fișa elevului și fișa cu barem se regenerează identic din același seed; profesorul poate „regenera” cu un click (seed nou) sau poate salva fișa.
- Generatoarele sunt **funcții pure** fără acces la rețea/DB → se testează ușor și rulează și în browser (jocurile funcționează fără a aștepta serverul).

### 2.1 Contractul unui generator

```ts
type Nivel = 'consolidare' | 'aprofundare' | 'evaluare' | 'competitie';

interface Generator<P = {}> {
  id: string;                    // ex. "c2.numere.descompunere-szu"
  clase: (1|2|3|4|5)[];
  competente: string[];          // coduri CS, ex. ["MEM-II-1.1"]
  niveluri: Nivel[];
  moduri: ('fisa' | 'joc')[];
  generate(rng: Rng, nivel: Nivel, p: P): Item;
}

interface Item {
  enunt: Bloc[];                 // text + componente vizuale (SVG) declarative
  raspuns: Raspuns;              // număr | text | listă | alegere | potrivire | desen
  interactiune: 'input' | 'alegere' | 'adevarat-fals' | 'potrivire' | 'ordonare'
              | 'drag-drop' | 'colorare' | 'ceas' | 'axa';
  rezolvare: PasRezolvare[];     // pentru fișa cu rezolvări (șablonul în 4 pași la probleme)
  punctaj: number;               // folosit la Evaluare (barem)
  dificultate: number;           // 1–10, pentru dificultatea adaptivă
  spatiuLucru?: 'linii' | 'patratele' | 'coloane-calcul' | 'nimic';
}
```

`Bloc` poate fi: `text`, `numaratoareBile`, `tabelSZU`, `axaNumerelor`, `ceas`, `fractieCerc`, `fractieDreptunghi`, `figuraGeometrica`, `graficBare`, `bancnoteMonede`, `balanta`, `coloanaCalcul`. Fiecare are o componentă SVG unică, folosită în PDF și în joc.

### 2.2 Tipuri de generatoare (extrase din fișele voastre + Soft‑Pak)

| Familie | Exemple de generatoare | Sursa tiparului |
|---|---|---|
| Numerație | formare cu numărătoarea cu bile, descompunere S/Z/U, scriere cu litere, potrivire cifre↔litere, vecini/predecesor/succesor, comparare, ordonare, rotunjire, numere pare/impare, „cel mai mare număr cu cifre diferite”, răsturnatul, numere formate din cifre date | fișele L5–L8 cl. II |
| Șiruri și reguli | continuă șirul, descoperă regula, numărul lipsă, tabla sutelor | Nivel 2 „descoperă regula” |
| Calcul | adunare/scădere cu/fără trecere, în coloană; tabla înmulțirii; împărțire cu/fără rest; termen/factor necunoscut; ordinea operațiilor; balanțe numerice | cap. 3–5 cl. II–III |
| Probleme text | 1, 2, 3 operații; comparație („cu atât mai mult”); mers invers; figurativă (segmente); fals/adevărat (tip Soft‑Pak TF); grilă (tip Soft‑Pak MC) | cap. 6 + Soft‑Pak MCA/TFA |
| Fracții | hașurare, citire, comparare, fracții echiunitare/subunitare, fracție dintr-un număr | cap. Fracții cl. III |
| Geometrie | recunoaștere figuri, perimetru, arie (pătrățele), simetrie, unghiuri | cap. 7 |
| Măsurări | transformări lungime/masă/capacitate, ceas, durate, calendar, bani (lei/bani) | cap. 8 |
| Date | tabel, grafic cu bare, pictograme | cap. 9 |
| Cifre romane | I, V, X, L, C, M; transformări; calendar | cl. III |
| Competiție | probleme originale tip Cangurul/Euclid/Gazeta (logică, capete-picioare, vârste, combinatorică simplă) — șabloane parametrizate + bancă scrisă de echipă | Feedback „LogicMatica” |

## 3. Modulele aplicației

```
src/
├── app/
│   ├── (auth)/autentificare
│   ├── profesor/                 # Panoul profesorului
│   │   ├── fise/noua            # generator fișe: clasă → capitol → lecție → competențe → nivel
│   │   ├── fise/[id]            # previzualizare, regenerare, PDF elev / PDF barem
│   │   ├── clase/[id]           # elevi, teme, progres, rapoarte
│   │   └── teme/noua            # set de exerciții digitale + cod de acces
│   ├── elev/                     # Zona elevului
│   │   ├── harta                # harta capitolelor (stil „călătorie”), progres
│   │   ├── joc/[tip]            # jocurile
│   │   ├── tema/[cod]           # tema trimisă de profesor
│   │   └── trofee
│   ├── admin/                    # școală: import elevi CSV, conturi, licențe
│   └── api/pdf/[fisaId]          # randare PDF cu Playwright
├── motor/
│   ├── rng.ts                    # generator pseudo-aleator cu seed (mulberry32)
│   ├── generatoare/clasa-1..5/   # câte un fișier per familie
│   ├── fise/compunere.ts         # alege itemi pe niveluri, calculează barem
│   ├── evaluare/barem.ts         # puncte → FB/B/S/I (cl. I–IV) sau nota 1–10 (cl. V)
│   └── adaptiv/                  # dificultate adaptivă (vezi §5)
├── componente/svg/               # Ceas, AxaNumerelor, Fractie, NumaratoareBile, TabelSZU, …
├── curriculum/                   # mapa curriculară (date JSON, versionată)
└── jocuri/                       # motorul de joc + cele N mecanici
```

## 4. Fișele PDF

- **Antet personalizabil**: școala, profesorul, clasa, data, „Nume elev: ____”, logo.
- **Cod de culoare** din documentul vostru: Consolidare = verde, Aprofundare = albastru, Evaluare = portocaliu, Competiție = mov. Fonturi: **Quicksand / Poppins** (cu diacritice ș, ț corecte, cu virgulă dedesubt).
- **Opțiune alb-negru** pentru economie la imprimare (culorile devin hașuri sau chenare).
- **Fișa „Evaluare”**: punctaj pe itemi, 10 p din oficiu (cl. V), barem generat automat și **descriptori de performanță**:
  - cl. I–IV: praguri configurabile (implicit FB ≥ 90%, B ≥ 70%, S ≥ 50%, I < 50%);
  - cl. V: nota = puncte/10, cu 1 p (10 p din 100) din oficiu.
- **Fișa cu rezolvări**: aceeași fișă + răspunsuri scrise cu altă culoare; pentru probleme, rezolvarea completă pe șablonul în 4 pași (Ce știu / Ce caut / Operații cu întrebare ajutătoare / Răspuns + probă).
- Dimensiune A4, margini de 15 mm, fără itemi tăiați între pagini (`break-inside: avoid`).

## 5. Jocurile și dificultatea adaptivă

**Motorul de joc** primește: o listă de generatoare + o mecanică + o durată. Aceeași mecanică poate rula orice conținut.
Mecanicile sunt **originale**, inspirate de categoriile Eduten (nu copiem grafica sau denumirile lor):

| Mecanică | Ce face | Potrivit pentru |
|---|---|---|
| **Scara** (MVP) | urci câte o treaptă la fiecare răspuns corect; greșeala te coboară | tabla înmulțirii, calcul rapid |
| **Numărătoarea magică** (MVP) | tragi bile pe tije S/Z/U ca să formezi numărul | valoarea pozițională |
| **Pizza fracțiilor** (MVP) | colorezi felii dintr-un cerc/dreptunghi | fracții |
| Ceasul fermecat | muți acele ceasului | timp |
| Balonul cu aer | baloane cu rezultate; spargi pe cel corect înainte să zboare | calcul mental |
| Adevărat sau Fals? | judeci afirmații/probleme (tip Soft‑Pak TF) | probleme text |
| Axa numerelor | plasezi numerele pe axă | comparare, ordonare, fracții |
| Cursa | concurezi cu propriul record | fluență |
| Magazinul | plătești cu lei și bani | bani |

**Dificultate adaptivă**: pentru fiecare elev × competență păstrăm un scor de stăpânire (0–100, actualizat de tip Elo). Jocul alege itemi cu `dificultate` aproape de scorul elevului; 3 răspunsuri corecte la rând → crește dificultatea; 2 greșeli → scade și afișează un indiciu vizual.

**Recompense** (din documentul vostru „Feedback”): **Puncte de Logică** (Aprofundare/Competiție) + **Puncte de Viteză** (fluență); stele 1–3 per lecție; trofee (de ex. „Stăpânul tablei cu 7”); la fiecare 100 de puncte se deblochează o „Carte de Misiuni” (problemă bonus); clasamentul săptămânal („Eroul săptămânii”) poate fi activat de profesor (implicit oprit, pentru a nu demotiva).

**Teme de la profesor**: profesorul alege generatoare + nivel + număr de itemi + termen → aplicația produce un **cod de 6 caractere** și un link. Elevul autentificat introduce codul; rezultatele ajung în raportul clasei.

## 6. Conturi, roluri, viitoarea plată

- Roluri: `ADMIN_SCOALA`, `PROFESOR`, `ELEV`.
- Elevii: email Proton Mail + parolă creată de școală, **import CSV** (nume, prenume, email, clasă) în panoul de administrare; parolă temporară, schimbată la prima intrare.
- **Licențe**: tabela `Licenta` există de la început (`tip: GRATUIT | PLATIT`, `valabilPanaLa`). Acum toate conturile sunt `GRATUIT`. Plata (25 €/cont) se adaugă ulterior cu Stripe fără schimbări de structură.
- GDPR: pentru elevi stocăm doar numele afișat, emailul școlar și rezultatele; fără date sensibile; export și ștergere la cerere.

## 7. Securitate

- Parole hash-uite cu bcrypt; sesiuni HTTP-only; limitarea încercărilor de autentificare.
- Elevii văd doar propriile date; profesorii doar clasele lor; adminul doar școala sa (verificare pe server pentru fiecare cerere).
- Niciun secret în cod: chei în variabile de mediu Vercel.

## 8. Ordinea de construcție (Pasul 3)

1. Proiectul de bază: Next.js, Prisma, autentificare, roluri, import CSV.
2. Motorul de generare + componentele SVG + **10 generatoare pentru clasa a II-a** (cap. 2 „Numere 0–1000”, după fișele voastre).
3. Generatorul de fișe + PDF elev + PDF rezolvări/barem.
4. Primele 3 jocuri (Scara, Numărătoarea magică, Pizza fracțiilor) + recompense.
5. Teme cu cod + rapoarte de progres.
6. Extindere capitol cu capitol: cl. II → III → IV → I → V.
