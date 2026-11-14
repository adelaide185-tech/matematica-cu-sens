# Mapa curriculară clasele I–V (Pasul 2)

> **Actualizare (Pasul 3):** mapa folosită de aplicație se află în `src/curriculum/index.ts` și a fost aliniată cu lista completă de lecții Eduten:
> - clasa I: 23 de lecții;
> - clasa a III-a: 30 de lecții;
> - clasa a IV-a: 36 de lecții.
>
> La **clasa a II-a**, cursul Eduten primit („Mathematics 2nd grade”, 48 de lecții) este varianta internațională. Conține lecții precum „Euros and cents” sau „Prepositions”, care nu corespund programei românești. De aceea, la clasa a II-a am păstrat curriculumul vostru „Matematică cu Sens” (36 de lecții). Inventarul Eduten se află în `surse_materiale/eduten/curriculum/`.

**Surse:**
- curriculumul vostru „Matematică cu Sens”, clasele a II-a și a III-a (Google Drive);
- structura Eduten (clasa I: Unitățile 1–2; clasele a III-a și a IV-a: Unitățile 7–8);
- programele școlare MEN: OM 3418/2013 (clasele I–II MEM), OM 5003/2014 (clasele III–IV), OM 3393/2017 (clasa a V-a).

> ⚠️ **De verificat:** codurile competențelor specifice (CS) sunt scrise din memorie, după structura programelor oficiale. Site-ul programe.ise.ro nu este accesibil din mediul meu de lucru. În Pasul 3 le confrunt cu textul oficial. Dacă aveți PDF-urile programelor, adăugați-le în `surse_materiale/programe/`.

## Conducerea codurilor
- `CS` = competență specifică. Prefixul arată programa: `MEM` (clasele I–II), `M34` (clasele III–IV), `M5` (clasa a V-a).
- Coloana **Generatoare** dă id-urile din `src/motor/generatoare`. Fiecare generator produce itemi pentru toate cele 4 niveluri: Consolidare, Aprofundare, Evaluare și Competiție.
- Pentru clasele I–IV, rezultatul Evaluării se exprimă în calificative FB/B/S/I. Pentru clasa a V-a, în note de la 1 la 10.

### Competențe generale

| Cod | Clasele I–II (MEM) | Clasele III–IV | Clasa a V-a |
|---|---|---|---|
| 1 | Utilizarea numerelor în calcule elementare | Recunoașterea și utilizarea numerelor în calcule elementare | Identificarea unor date, mărimi și relații matematice |
| 2 | Evidențierea caracteristicilor geometrice ale unor obiecte din spațiul înconjurător | Evidențierea caracteristicilor geometrice ale unor obiecte din spațiul înconjurător | Prelucrarea datelor de tip cantitativ, calitativ, structural |
| 3 | Identificarea unor fenomene, relații, regularități și structuri din mediul apropiat | Identificarea unor fenomene, relații, regularități și structuri din mediul apropiat | Utilizarea conceptelor și a algoritmilor specifici în diverse contexte matematice |
| 4 | Generarea unor explicații simple prin folosirea unor elemente de logică | Utilizarea unor etaloane convenționale pentru măsurări și estimări | Exprimarea în limbajul specific matematicii a informațiilor, concluziilor și demersurilor de rezolvare |
| 5 | Rezolvarea de probleme pornind de la sortarea și reprezentarea unor date | Rezolvarea de probleme pornind de la sortarea și reprezentarea unor date | Analizarea caracteristicilor matematice ale unei situații date |
| 6 | Utilizarea unor etaloane convenționale pentru măsurări și estimări | — | Modelarea matematică a unei situații date, prin integrarea achizițiilor din diferite domenii |

---

## CLASA I (MEM, doar componenta matematică)
Conținuturi: numerele 0–100; adunare și scădere în concentrul 0–100 fără trecere peste ordin.

| # | Capitol | Lecții | CS | Generatoare principale |
|---|---|---|---|---|
| 1 | Numerele 0–31 (recapitulare CP) | Formare, citire, scriere · Numere pare/impare · Comparare și ordonare | MEM 1.1, 1.2, 1.3 | `numaratoare-bile`, `pare-impare`, `comparare`, `ordonare`, `vecini` |
| 2 | Adunarea și scăderea 0–10 / 0–20 / 0–31 | Adunarea cu 1–5 · Adunarea cu 6–9 · Scăderea cu 1–5 · Scăderea cu 6–9 · Termenul necunoscut | MEM 1.4, 1.6 | `adunare-simpla`, `scadere-simpla`, `termen-necunoscut`, `descompunere-10` |
| 3 | Numerele 0–100 | Zeci și unități · Citire, scriere · Comparare, ordonare · Axa numerelor | MEM 1.1–1.3 | `bete-manunchiuri`, `axa-numerelor`, `zeci-unitati` |
| 4 | Adunarea și scăderea 0–100 fără trecere | Zeci cu zeci · Număr de 2 cifre ± o cifră · Număr de 2 cifre ± număr de 2 cifre | MEM 1.4 | `adunare-0-100`, `scadere-0-100`, `coloana-calcul` |
| 5 | Probleme | Probleme cu o operație · Probleme ilustrate · Compunere de probleme | MEM 1.6, 5.1 | `problema-o-operatie`, `adevarat-fals-problema` |
| 6 | Geometrie | Figuri plane (pătrat, dreptunghi, triunghi, cerc) · Corpuri (cub, sferă, cilindru) · Poziții (sus/jos, stânga/dreapta) | MEM 2.1, 2.2 | `recunoaste-figura`, `pozitii-spatiale` |
| 7 | Măsurări | Lungime (etaloane nestandard) · Ziua, săptămâna, luna · Ceasul (ore fixe) · Banii (1, 5, 10 lei) | MEM 6.1, 6.2 | `ceas-ore-fixe`, `zilele-saptamanii`, `bani-lei` |
| 8 | Organizarea datelor | Sortare · Pictograme · Tabele simple | MEM 5.1 | `pictograma`, `tabel-simplu` |

## CLASA a II-a (după curriculumul vostru „Matematică cu Sens”, 36 de lecții)

| # | Capitol | Lecții (numerotarea voastră) | CS | Generatoare principale |
|---|---|---|---|---|
| 1 | Recapitulare clasa I | L1 Numerele până la 100 · L2 Adunare și scădere fără trecere · L3 Probleme cu o operație · L4 Recapitulare + hartă mentală | MEM 1.1–1.4, 5.1 | refolosește generatoarele cl. I |
| 2 | Numere naturale 0–1000 | L5 Formarea din U, Z, S · L6 Citire și scriere · L7 Vecini și descompunere · L8 Comparare și ordonare · L9 Serii logice · L10 Recapitulare | MEM 1.1, 1.2, 1.3 | `numaratoare-bile`, `descompunere-szu`, `scriere-litere`, `potrivire-cifre-litere`, `tabel-szu`, `vecini`, `comparare`, `ordonare`, `rotunjire`, `cifre-date` (numere din cifrele 0, 8, 6), `extreme-cifre` (cel mai mare/mic cu cifre diferite), `rasturnat`, `sir-regula` |
| 3 | Adunarea și scăderea 0–1000 | L11–L12 fără trecere · L13–L14 cu trecere · L15 Relația adunare–scădere (proba) · L16 Recapitulare | MEM 1.4, 1.6 | `adunare-coloana`, `scadere-coloana`, `proba`, `termen-necunoscut`, `balanta-numerica` |
| 4 | Înmulțirea | L17 Adunări repetate · L18 Tabla cu 2, 3 · L19 Tabla cu 4, 5 · L20 Tabla cu 10 · L21 Recapitulare | MEM 1.5 | `adunare-repetata`, `tabla-inmultirii`, `factor-necunoscut`, `grupe-egale-svg`, `comutativitate` |
| 5 | Împărțirea | L22 Distribuire egală · L23 Legătura înmulțire–împărțire · L24 Probleme · L25 Recapitulare | MEM 1.5 | `impartire-grupe`, `impartire-tabla`, `familia-de-fapte` |
| 6 | Probleme aritmetice și logice | L26 o operație · L27 două operații · L28 diagrame și tabele · L29 Recapitulare | MEM 1.6, 4.1, 5.1 | `problema-o-operatie`, `problema-doua-operatii`, `cu-atat-mai-mult`, `problema-grila` (tip Soft‑Pak MC), `adevarat-fals-problema` (tip Soft‑Pak TF) |
| 7 | Elemente de geometrie | L30 Punct, linie, segment, semidreaptă · L31 Triunghi, pătrat, dreptunghi · L32 Perimetrul · L33 Recapitulare | MEM 2.1, 2.2 | `recunoaste-figura`, `numara-figuri`, `perimetru-laturi` |
| 8 | Măsurători | L34 Lungime (m, dm, cm) · L35 Masă, timp, bani (kg, g, ora, leu, ban) · L36 Recapitulare | MEM 6.1, 6.2 | `transformari-lungime`, `ceas`, `durata`, `calendar`, `bani-lei-bani`, `cumparaturi` |
| 9 | Organizarea datelor + evaluări | Tabele · Grafice cu bare · Evaluare finală | MEM 5.1 | `tabel-date`, `grafic-bare` |

Evaluări speciale: **inițială**, **semestrială** și **finală**. Ele combină automat generatoare din capitolele parcurse.

## CLASA a III-a (după curriculumul vostru, completat cu Eduten și programa)

| # | Capitol | Lecții | CS | Generatoare principale |
|---|---|---|---|---|
| 1 | Numere naturale 0–10 000 | Formare (U, Z, S, M) · Citire și scriere · Comparare și ordonare · Rotunjire · „Descoperă regula” | M34 1.1–1.3 | generatoarele cl. II extinse la 10 000 + `rotunjire` |
| 2 | Cifre romane | I, V, X și reguli · Numere până la XXX/C · Calendar | M34 1.1 | `cifre-romane`, `romane-calendar` |
| 3 | Adunarea și scăderea 0–10 000 | Fără/cu trecere · Proba · Termen necunoscut · Calcul rapid | M34 1.4 | `adunare-coloana`, `scadere-coloana`, `suma-cifrelor` |
| 4 | Înmulțirea | Tabla înmulțirii (recapitulare) · Număr × o cifră · **Nivel 2:** zeci × zeci (20 × 30), număr de 2 cifre × o cifră (45 × 2) | M34 1.5 | `tabla-inmultirii`, `inmultire-o-cifra`, `zeci-ori-zeci` |
| 5 | Împărțirea | Tabla împărțirii · **Împărțirea cu rest** · Proba | M34 1.5 | `impartire-tabla`, `impartire-rest` |
| 6 | Ordinea operațiilor și probleme | Paranteze · Probleme cu 2–3 operații · Metoda figurativă · Mers invers | M34 1.6, 5.1, 5.2 | `ordinea-operatiilor`, `problema-doua-operatii`, `metoda-figurativa`, `mers-invers` |
| 7 | Fracții | Jumătate, sfert, treime · Fracții subunitare și echiunitare · Comparare (același numitor) · Fracția dintr-un număr | M34 1.1, 1.2, 1.4 | `fractie-hasurata`, `fractie-segment`, `fractii-subunitare`, `comparare-fractii`, `fractie-din-numar` |
| 8 | Geometrie (Eduten U7) | Unghiuri, poligoane · Figuri plane · Simetria · Perimetrul · Corpuri geometrice | M34 2.1–2.3 | `unghi-tip`, `poligon`, `axa-simetrie`, `perimetru`, `corpuri` |
| 9 | Măsurări (Eduten U8) | Lungime (m, dm, cm, mm) · Masă și capacitate · Masa · Timpul și ceasurile · Moneda | M34 4.1–4.3 | `transformari-lungime`, `transformari-masa`, `capacitate`, `ceas`, `durata`, `bani` |
| 10 | Organizarea datelor | Tabele, grafice | M34 5.3 | `tabel-date`, `grafic-bare` |

## CLASA a IV-a (Eduten U7–U8 + programa)

| # | Capitol | Lecții | CS | Generatoare principale |
|---|---|---|---|---|
| 1 | Numere naturale 0–1 000 000 | Formare, citire, scriere · Comparare, ordonare · Rotunjire · Cifre romane | M34 1.1–1.3 | generatoarele extinse la 1 000 000 |
| 2 | Adunarea și scăderea 0–1 000 000 | Algoritmi · Proba · Termen necunoscut · Proprietăți | M34 1.4 | `adunare-coloana`, `scadere-coloana` |
| 3 | Înmulțirea | Număr × număr de 1–2 cifre · Înmulțirea cu 10, 100, 1000 · Proprietăți | M34 1.5 | `inmultire-coloana`, `inmultire-10-100` |
| 4 | Împărțirea | La un număr de o cifră · La 10, 100, 1000 · Cu rest · Proba | M34 1.5 | `impartire-coloana`, `impartire-rest` |
| 5 | Ordinea operațiilor și metode de rezolvare | Paranteze · Metoda figurativă · Metoda comparației · Mersul invers · Falsa ipoteză | M34 1.6, 5.1, 5.2 | `ordinea-operatiilor`, `metoda-figurativa`, `metoda-comparatiei`, `mers-invers`, `falsa-ipoteza` |
| 6 | Fracții | Fracții echivalente (intuitiv) · Comparare · Adunare și scădere cu același numitor · Fracția dintr-un număr | M34 1.1–1.4 | `fractii-adunare`, `comparare-fractii`, `fractie-din-numar` |
| 7 | Geometrie (Eduten U7) | Drepte perpendiculare și paralele · Estimarea și măsurarea unghiurilor · Poligoane și cerc · Simetria · Aria și perimetrul · Paralelipipedul dreptunghic | M34 2.1–2.3 | `drepte-perpendiculare-paralele`, `unghi-tip`, `poligon`, `cerc-elemente`, `axa-simetrie`, `arie-patratele`, `perimetru`, `desfasurare-cub` |
| 8 | Măsurări (Eduten U8) | Lungime · Masă și volum · Timpul · Prețuri | M34 4.1–4.3 | `transformari-*`, `durata`, `secol-deceniu`, `preturi` |
| 9 | Organizarea datelor | Tabele, grafice, diagrame | M34 5.3 | `tabel-date`, `grafic-bare` |

## CLASA a V-a (programa OM 3393/2017)

| # | Capitol | Lecții | CS | Generatoare principale |
|---|---|---|---|---|
| 1 | Numere naturale | Scriere, comparare, rotunjire · Operații · Puteri (pătrat, cub, reguli de calcul) · Ordinea operațiilor · Factorul comun | M5 1.1, 2.1, 3.1 | `puteri`, `ordinea-operatiilor-5`, `factor-comun` |
| 2 | Metode aritmetice | Metoda reducerii la unitate · Metoda comparației · Metoda figurativă · Mersul invers · Falsa ipoteză | M5 4.1, 6.1 | `reducere-unitate`, `metoda-*` |
| 3 | Divizibilitate | Divizor, multiplu · Criteriile de divizibilitate cu 2, 5, 10ⁿ, 3, 9 · Numere prime și compuse | M5 1.1, 3.1 | `divizori-multipli`, `criterii-divizibilitate`, `prime` |
| 4 | Fracții ordinare | Subunitare, echiunitare, supraunitare · Amplificare, simplificare · Comparare · Adunare, scădere · Înmulțire, împărțire · Fracții dintr-un număr · Procente | M5 1.2, 3.2 | `fractii-*`, `procente` |
| 5 | Fracții zecimale | Scriere, comparare, rotunjire · Operații · Transformări fracție ↔ zecimal · Media aritmetică | M5 1.3, 3.3 | `zecimale-*`, `medie-aritmetica` |
| 6 | Geometrie și unități de măsură | Punct, dreaptă, plan, semidreaptă, segment · Lungimea segmentului, mijlocul · Unghiuri (măsurare cu raportorul, clasificare) · Unități de măsură (lungime, arie, volum) | M5 1.5, 3.5 | `segment-mijloc`, `unghi-masura`, `unitati-arie-volum`, `perimetru-arie` |

---

## Cum se construiește o fișă din mapă

```
Clasa → Capitol → Lecție(i) → Competențe (bifate automat; profesorul poate debifa)
      → Nivel: Consolidare | Aprofundare | Evaluare | Competiție
      → Nr. itemi (implicit: 8 / 6 / 10–12 / 5)
      → Generare (seed) → Previzualizare → [Regenerează] → PDF elev / PDF rezolvări + barem
```

**Profilul fiecărui nivel**, după fișele voastre:

| Nivel | Compoziție implicită |
|---|---|
| Consolidare | 70% calcul algoritmic + 30% aplicații directe; numere „rotunde”; fără capcane |
| Aprofundare | itemi în mai mulți pași, regulă de descoperit, număr necunoscut, probleme cu 2 operații |
| Evaluare | Partea I (itemi obiectivi) + Partea II (semi-obiectivi și o problemă de sinteză); punctaj pe item; barem; descriptori FB/B/S sau notă |
| Competiție | probleme originale în stil Cangurul/Euclid: logică, combinatorică simplă, șiruri progresive, „capete și picioare”, vârste, mers invers |
