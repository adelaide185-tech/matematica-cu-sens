# Plan: jocuri educaționale pentru fiecare noțiune

> **Stadiu:**
> - Implementate și testate:
>   - faza A (motorul);
>   - faza B (numerație, operații, probleme: 28 de subiecte);
>   - faza C (fracții, măsurări, timp, bani: 16 subiecte);
>   - faza D (geometrie și date: 12 subiecte; completează și lecțiile de pe fișe);
>   - faza E (clasa a V-a: 15 subiecte noi + 10 extinse; răspuns zecimal cu virgulă).
> - Total: 71 de subiecte; toate lecțiile claselor I–V au exerciții pe fișe și în antrenament.
> - Capacitatea măsurată a fiecărui subiect apare în testul `src/antrenament/antrenament.test.ts`.

## 1. Auditul codului actual

| Clasa | Capitole | Lecții | Lecții cu generatoare | Ce lipsește |
|---|---|---|---|---|
| I | 7 | 23 | 18 | geometrie (2), lungime, capacitate, bani |
| II | 9 | 30 | 26 | geometrie (3), organizarea datelor |
| III | 8 | 29 | 21 | geometrie (6), diagrame, moneda |
| IV | 8 | 30 | 21 | geometrie (7), diagrame, prețuri |
| V | 6 | 6 | 0 | toată clasa |
| **Total** | **38** | **118** | **86** | **32 de lecții fără exerciții** |

Avem **28 de generatoare** și **3 jocuri** (Scara, Numărătoarea magică, Pizza fracțiilor). Generatoarele produc acum „itemi de fișă” (un enunț cu cerințele a, b, c…), nu exerciții individuale pentru joc.

### Câte exerciții distincte poate produce fiecare generator (măsurat)

| Generator | Cl. I | Cl. II | Cl. III | Cl. IV | Ajunge pentru 100? |
|---|---|---|---|---|---|
| numărătoare / descompunere / vecini | 90 | 900 | 5000+ | 5000+ | cl. I: **nu** (90) |
| compunere, comparare, ordonare, șiruri | 171–5000+ | 4299+ | 5000+ | 5000+ | da |
| scriere cu litere | 108 | 1152 | 5000+ | 5000+ | da |
| rotunjire | — | 1800 | 5000+ | 5000+ | da |
| „cel mai mare/mic număr cu…” | — | **50** | **68** | **68** | **nu** |
| numere din cifre date | — | 120 | 120 | 120 | la limită |
| adunare/scădere, termen necunoscut | 5000+ | 5000+ | 5000+ | 5000+ | da |
| tabla înmulțirii | — | 272 | 342 | 342 | da |
| tabla împărțirii | — | **60** | **90** | **90** | **nu** |
| înmulțire extinsă / împărțire cu rest | — | — | 324–810 | 3249+ | da |
| ordinea operațiilor | — | 2847 | 4702 | 4702 | da |
| fracția colorată | — | **12** | **74** | **74** | **nu** |
| compararea fracțiilor / fracția din număr | — | — | 171–551 | 551–928 | da |
| ceasul | **12** | **48** | 144 | 144 | **nu** la cl. I–II |
| transformări de unități | — | 3167 | 3942 | 3942 | da |
| cifre romane | — | — | 230 | 2024 | da |
| probleme (o operație / două / A–F / concurs) | ~3000 | ~3000 | ~3000 | ~3000 | da |

**Concluzie:** la subiectele cu spațiu mic (tabla împărțirii, fracțiile simple, ceasul cu ore fixe, „cel mai mare număr cu…”), 100 de exerciții **distincte** sunt posibile doar dacă variem reprezentarea (§3.3). Nu putem schimba matematica: la clasa I există doar 12 ore fixe.

## 2. Noțiunile și jocurile propuse

Mecanicile de bază sunt **componente reutilizabile**; fiecare noțiune folosește 1–2 dintre ele. Toate sunt desenate în SVG și merg cu atingere, mouse sau tastatură.

### Biblioteca de mecanici (16)

| # | Mecanică | Ce înțelege copilul (concret → abstract) |
|---|---|---|
| M1 | **Bețișoare și mănunchiuri / blocuri baza 10** (unități, zeci, sute, mii) | ce înseamnă „o zece” și „o sută”: grupăm, apoi schimbăm 10 → 1 |
| M2 | **Numărătoarea cu bile** (există deja) | valoarea poziției cifrei |
| M3 | **Axa numerelor**: plasează, sari, rotunjește | ordinea, distanța, „mai aproape de” |
| M4 | **Balanța** | egalitatea; termenul necunoscut ca „ce lipsește ca să fie în echilibru” |
| M5 | **Cadrul de 10 / dublu cadru** | completarea până la 10 (trecerea peste ordin) |
| M6 | **Grupe egale și matrice** (rânduri × coloane, rotire) | înmulțirea ca adunare repetată; comutativitatea |
| M7 | **Farfuriile**: împarte obiectele în mod egal | împărțirea ca distribuire; restul se vede ca „ce nu încape” |
| M8 | **Completează tiparul / șirul** | regularități, regula unui șir |
| M9 | **Sortare în coșuri** | clasificare: par/impar, figuri, unghiuri |
| M10 | **Potrivire perechi** | reprezentări echivalente: cifre ↔ litere, romane, ceas analog ↔ digital |
| M11 | **Calcul în coloană ghidat**, cu „schimbul” animat | algoritmul scris, legat de M1 |
| M12 | **Modelul în bară (segmente)** | probleme: parte–întreg, comparație, metoda figurativă |
| M13 | **Ceasul interactiv** (muți acele) | ora, jumătatea, sfertul, minutele, durata |
| M14 | **Fracții**: pizza, bandă, grilă 10×10 | partea dintr-un întreg; comparare; procente |
| M15 | **Magazinul** (monede și bancnote) | banii, restul |
| M16 | **Instrumente de măsură**: riglă, cântar, recipiente, grilă (perimetru/arie), oglindă (simetrie) | măsurarea și unitățile |

Jocurile existente se păstrează. **Scara** și **Cursa** rămân pentru fluență: Cursa fără cronometru implicit, doar dacă profesorul îl activează.

### Noțiunile, pe clase, cu jocul propus

> O noțiune poate apărea la mai multe clase, cu concentre diferite (0–31, 0–100, 0–1000, 0–10 000, 0–1 000 000). Este **același subiect**, cu limite date de clasă.

#### Numerație
| Noțiune | Clase | Joc 1 | Joc 2 |
|---|---|---|---|
| Formarea, citirea, scrierea numerelor | I–IV | M1 blocuri baza 10 | M2 numărătoare |
| Scrierea cu litere | I–IV | M10 potrivire cifre ↔ litere | alege scrierea corectă |
| Descompunerea (S, Z, U, M) | I–IV | M1: „sparge” numărul în blocuri | completează suma |
| Vecini, predecesor, succesor | I–IV | M3 axa | tabla sutelor (cl. I–II) |
| Compararea | I–IV | M4 balanța (< > =) | M3 axa |
| Ordonarea | I–IV | trage cartonașele în ordine | M3 axa |
| Numere pare / impare | I–II | M9 coșuri | M6 „perechi”: rămâne unul fără pereche? |
| Rotunjirea | II–IV | M3: „la ce zece/sută e mai aproape?” | — |
| Șiruri și reguli | I–IV | M8 tipar | descoperă regula |
| Numere din cifre date / „cel mai mare cu…” | II–IV | cartonașe cu cifre (trage cifrele) | — |
| Cifre romane | III–IV | M10 potrivire | construiește cu bețe I, V, X, L, C |

#### Operații
| Noțiune | Clase | Joc 1 | Joc 2 |
|---|---|---|---|
| Adunare/scădere 0–10, 0–20 | I | M5 cadrul de 10 | M3 salturi pe axă |
| Adunare/scădere fără trecere peste ordin | I–IV | M1 blocuri | M11 coloană |
| Adunare/scădere **cu** trecere peste ordin | I–IV | M11 coloană ghidată + schimb animat | M5 / M1 |
| Termenul necunoscut, proba | I–IV | M4 balanța | „familia de fapte” (triunghi) |
| Înmulțirea ca adunare repetată | II | M6 grupe egale | — |
| Tabla înmulțirii | II–IV | M6 matrice | Scara (fluență) |
| Comutativitate / asociativitate | III–IV | M6: rotește matricea | — |
| ×10, ×100, ×1000 | III–IV | M1: blocurile „cresc” un ordin | — |
| Înmulțirea în coloană; zeci × zeci | III–IV | modelul ariei (dreptunghi împărțit) | M11 |
| Împărțirea ca distribuire / scădere repetată | II–III | M7 farfurii | M3 salturi înapoi |
| Tabla împărțirii; legătura cu înmulțirea | II–IV | M6 matrice „citită invers” | familia de fapte |
| Împărțirea cu rest | III–IV | M7, cu restul care „nu încape” | — |
| Împărțirea la 1–2 cifre | IV | împărțire scrisă ghidată pas cu pas | — |
| Ordinea operațiilor, expresii | II–IV | arborele de calcul (pași colorați) | — |
| Ecuații | IV | M4 balanța | — |

#### Probleme
| Noțiune | Clase | Joc 1 | Joc 2 |
|---|---|---|---|
| Probleme cu o operație | I–IV | M12 modelul în bară | Adevărat / Fals |
| Probleme cu două operații | II–IV | M12 în doi pași (șablonul vostru în 4 pași) | — |
| Metoda figurativă, comparația, mersul invers, falsa ipoteză | III–IV | M12 / săgeți înapoi / tabel de încercări | — |
| Probleme de logică (concurs) | II–IV | puzzle cu indicii | — |

#### Fracții
| Noțiune | Clase | Joc 1 | Joc 2 |
|---|---|---|---|
| Jumătate, sfert (introducere) | II | M14 pizza | „jumătate din 8 mere” (obiecte) |
| Fracția ca parte dintr-un întreg | III–IV | M14 pizza / bandă | potrivire fracție ↔ desen |
| Compararea fracțiilor | III–IV | benzi de fracții puse una sub alta | M3 axa 0–1 |
| Fracția dintr-un număr | III–IV | M7: împarte în părți, ia câteva | M12 |
| Numere mixte; adunare/scădere cu același numitor | IV | pizza întregi + felii | bandă |
| Procente | IV | grila 10×10 | — |

#### Măsurări, timp, bani
| Noțiune | Clase | Joc 1 | Joc 2 |
|---|---|---|---|
| Lungime (nestandard → m, dm, cm, mm, km) | I–IV | M16 riglă | transformări cu „scara unităților” |
| Masă, capacitate | I–IV | M16 cântar / recipiente | transformări |
| Ceasul: ore fixe → jumătăți → sferturi → minute | I–IV | M13 muți acele | M10 analog ↔ digital |
| Durata, calendarul, zilele săptămânii | I–IV | M3 axa timpului | ordonare |
| Bani: leu, ban, prețuri | I–IV | M15 magazinul (plătește exact / dă restul) | — |

#### Geometrie și date
| Noțiune | Clase | Joc 1 | Joc 2 |
|---|---|---|---|
| Punct, dreaptă, segment, semidreaptă | II–III | M9 sortare | desenează pe grilă |
| Figuri plane, corpuri | I–IV | M9 sortare / „găsește în imagine” | potrivire corp ↔ obiect |
| Unghiuri (drept, ascuțit, obtuz) | III–IV | M9 coșuri cu colțarul | estimare |
| Perpendiculare, paralele | IV | identifică pe grilă | — |
| Simetria | II–IV | oglindește pe grilă | — |
| Perimetrul, aria | II–IV | grila: mergi pe contur / numără pătrățele | — |
| Planul de coordonate | IV | „vânătoarea de comori” pe grilă | — |
| Paralelipipedul / cubul | IV | numără cuburile; desfășurări | — |
| Tabele, pictograme, grafice cu bare | I–IV | citește graficul | completează graficul |

**Total: în jur de 60 de subiecte** pentru clasele I–IV. Clasa a V-a vine într-o fază separată.

## 3. Motorul de generare (până la 100 de exerciții pe subiect)

### 3.1 De la „item de fișă” la „exercițiu”
Fiecare subiect primește un generator de **exerciții individuale** (un singur răspuns pe exercițiu):

```ts
interface Subiect {
  id: string;                          // „op.adunare-trecere”
  titlu: string; clase: Clasa[]; competente: string[];
  mecanici: MecanicaId[];              // 1–2 jocuri
  exercitiu(rng, nivel: "usor" | "mediu" | "provocare", clasa): Exercitiu;
  capacitate(nivel, clasa): number;    // câte exerciții distincte există (calculat, testat)
}
interface Exercitiu {
  cheie: string;                       // identitate canonică, ex. „add:47+38”
  fapt: string;                        // faptul matematic, ex. „47+38” (pentru spațiere)
  enunt: string; vizual?: Vizual; mecanica: MecanicaId;
  raspuns: Raspuns;                    // validare automată
  indicii: Indiciu[];                  // pași vizuali, de la ușor la explicit (§4)
  dificultate: number;
}
```

Generatoarele de fișe actuale **refolosesc** aceleași subiecte, deci fișele PDF câștigă și ele noțiunile noi.

### 3.2 Unicitatea în sesiune (10 / 20 / 50 / 100)
1. Constructorul de sesiune cere exerciții până adună N **chei distincte**. Are un număr maxim de încercări, iar seed-ul face totul reproductibil, pentru pauză și reluare.
2. Același **fapt** (de ex. 7 × 8) nu reapare la mai puțin de 10 exerciții distanță, nici într-o altă reprezentare.
3. **Constrângerile de vârstă** sunt testate automat pentru fiecare subiect, clasă și nivel:
   - fără rezultate negative;
   - concentrul clasei e respectat (0–31, 0–100…);
   - tabla înmulțirii doar cu factorii din programă;
   - trecerea peste ordin apare doar unde e cerută;
   - restul e mai mic decât împărțitorul.
4. **Capacitatea** se calculează și se afișează în configurare. Dacă un subiect are, la un nivel, mai puțin de N exerciții distincte, butoanele 50 sau 100 apar dezactivate, cu explicația: „Subiectul are 48 de exerciții diferite la nivelul Ușor”. Profesorul poate atunci urca nivelul sau adăuga alt subiect.

### 3.3 Cum ajung la 100 subiectele cu spațiu mic
Același fapt prezentat prin **altă mecanică este alt exercițiu** (altă cheie). Exemplu la ceasul cu ore fixe (cl. I):
- citește ceasul;
- mută acele;
- potrivește analog ↔ digital;
- „ce oră va fi peste 2 ore?”

Asta dă peste 100. Spațierea faptului (§3.2, punctul 2) previne repetarea mecanică.

| Subiect cu spațiu mic | Extindere |
|---|---|
| Tabla împărțirii (60–90) | matrice + farfurii + familia de fapte + împărțitor necunoscut → 240–360 |
| Fracția colorată, cl. II (12) | jumătate/sfert din forme diferite + din grupe de obiecte (½ din 8) → 100+ |
| Ceasul, cl. I–II (12–48) | 4 reprezentări + durate → 100+ |
| „Cel mai mare număr cu…” (50–68) | șabloane noi (cifre date, sumă, paritate, poziție) → 200+ |
| Numărătoarea, cl. I (90) | numărătoare + bețișoare + blocuri + litere → 300+ |

### 3.4 Modul „Antrenament mixt” (mai multe subiecte)
1. Se bifează subiecte din orice capitole ale clasei (sau și din clasele anterioare, pentru recapitulare).
2. Fiecare subiect primește o cotă **egală** (N / k). Profesorul poate da ponderi (1×, 2×).
3. Dacă un subiect nu își poate umple cota, aceasta trece la celelalte.
4. Exercițiile se **amestecă**, cu două reguli:
   - același subiect apare de cel mult 2 ori la rând;
   - ordinea e de la ușor la greu în primul sfert al sesiunii (încălzire), apoi amestecat.
5. Pentru fiecare exercițiu se reține subiectul, pentru raportul de la final.

## 4. Principii pedagogice și UX

| Cerință | Cum o implementăm |
|---|---|
| **Concret → abstract** | Fiecare subiect pornește cu mecanica vizuală. Doar la nivelul Provocare apar exerciții numai cu simboluri. La Ușor obiectele se manipulează (trage, grupează, schimbă). |
| **Feedback blând** | Fără sunete implicite; opțional sunete moi, pornite de profesor. Fără „X” roșu și fără puncte scăzute. Mesaj cald: „Hai să ne uităm împreună”. |
| **Indicii pas cu pas** | **1-a greșeală:** indiciu vizual (de ex. la 47 + 38 se luminează coloana unităților: „7 + 8 = ?”). **A 2-a greșeală:** pasul următor (cele 10 unități se transformă animat într-o zece). **A 3-a greșeală:** rezolvarea completă, apoi copilul o reface singur. Exercițiul se notează „cu ajutor”, nu „greșit”. |
| **Fără presiune** | Fără cronometru implicit. Încurajăm efortul („Ai găsit singur!”), nu viteza. |
| **Niveluri** | Ușor / Mediu / Provocare per subiect. Pe fișe rămân cele 4 niveluri existente; Evaluarea nu e joc. |
| **Bară de progres** | „23 din 50” + bară colorată + stele adunate pe parcurs. |
| **Pauză și salvare** | Butonul „Pauză” salvează sesiunea (seed, poziție, răspunsuri) în cont, cu copie în browser. Pe pagina elevului apare „Continuă de unde ai rămas”. |
| **Ecranul de final** | Fiecare subiect primește un verdict: 🌟 **Stăpânit** (≥ 85% din prima), 🌱 **Aproape** (60–84%), 🔁 **Mai exersăm** (< 60% sau multe indicii). Apoi un buton „Exersează ce a fost greu”, care pornește o sesiune nouă doar cu subiectele 🔁. |
| **Interfață** | Butoane de minimum 56 px; tastatură numerică pe ecran; mod „tablă interactivă” (totul mai mare, fără hover). Culori calde (galben, mov, verde blând), fonturi lizibile, texte în română cu diacritice. Accesibilitate: contrast, ARIA, navigare din tastatură, „reduce mișcarea”. |

### Ce se salvează (bază de date)
- Model nou `SesiuneJoc`: elev, subiecte, nivel, N, seed, poziție, stare (în curs / pauză / terminată), rezultate pe subiect.
- Se reutilizează `RaspunsItem` pentru fiecare exercițiu (subiect, corect din prima / cu ajutor, timp).
- `Stapanire` (elev × subiect) se actualizează la final. Din ea vor ieși rapoartele profesorului și recomandările.

## 5. Ordinea de implementare (după confirmare)

| Faza | Conținut | Rezultat verificabil |
|---|---|---|
| **A. Motorul** | `Subiect` / `Exercitiu`, constructorul de sesiune (unicitate, spațiere, amestec, cote), capacitatea, pagina de configurare (subiecte, nivel, 10/20/50/100), playerul (bară, indicii, pauză), ecranul de final, salvarea în cont | teste: 100 de exerciții unice pe subiect (sau limita corectă afișată), constrângeri de vârstă, reluare identică după pauză |
| **B. Numerație și operații** (I–IV) | mecanicile M1–M8, M11, M12; ~30 de subiecte | fiecare subiect testat pe toate clasele și nivelurile |
| **C. Fracții, măsurări, timp, bani** | M13–M16; ~15 subiecte | — |
| **D. Geometrie și date** | grilă, simetrie, unghiuri, grafice; ~15 subiecte; completează și lecțiile „în curând” de pe fișe | — |
| **E. Clasa a V-a** | după programa OM 3393/2017 | — |
