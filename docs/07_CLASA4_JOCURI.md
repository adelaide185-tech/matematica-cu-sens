# Clasa a IV-a (semestrul al II-lea): fișe, exerciții rezolvate și jocuri

Profesorul deschide **Clasa a IV-a (semestrul II)** din `/profesor` (pagina `/profesor/clasa4`).
Elevul are jocul liber în `/elev/clasa4` și temele în `/elev/tema/<cod>`.

## Capitolele (din cuprinsul manualului)

Fiecare capitol are **Nivel 1** (exerciții de bază) și **Nivel 2** (mai mulți pași). Profesorul poate alege și **Amestecat**.

| # | Capitol | Nivel 1 | Nivel 2 |
|---|---|---|---|
| 1 | Elemente de geometrie | drepte paralele / perpendiculare / concurente (desen), numele figurii, laturi și vârfuri, perimetrul | latura din perimetru, perimetru cu transformări (m și cm), paralelogram, triunghi echilateral |
| 2 | Corpurile geometrice | numele corpului (desen), fețe / muchii / vârfuri | ce corp se rostogolește, suma muchiilor la cub și cuboid |
| 3 | Metoda figurativă | sumă și diferență, sumă și raport | diferență și raport, trei mărimi (cu desen din segmente) |
| 4 | Probleme prin încercări | două numere consecutive, găini și iepuri | trei numere consecutive, numărul din cifre, bancnote |
| 5 | Estimare | rotunjim la zeci / sute, apoi adunăm sau scădem | la mii, cea mai bună estimare, produse, probleme cu prețuri |
| 6 | Logică și probabilități | sigur / posibil / imposibil, culoarea cea mai probabilă (desen cu bile) | așezări, strângeri de mână, ținute, numere din cifre date, cazul cel mai nefavorabil |
| 7 | Tabele | totalul, cea mai mare valoare | diferența, valoarea care lipsește (știind totalul), totalul fără două rânduri |
| 8 | Etaloane convenționale | unitatea și instrumentul potrivit | câte căni gradate, lungimea din pași |
| 9–11 | Capacitate, lungime, masă | transformări între unitățile folosite des | toate unitățile (kl…ml, km…mm, t, q…mg), mărimi compuse, probleme |
| 12 | Timp | transformări (minut…mileniu), secolul unui an (cifre romane) | mărimi compuse, durata între două ore |

Toate rezultatele sunt numere naturale până la 1 000 000.

## Fișa

- **Fișa elevului**, **Cu răspunsuri**, **Barem** (ca la clasa a III-a), plus **Exerciții rezolvate**: enunțul, desenul, rezolvarea pas cu pas și răspunsul.
- PDF: `/api/pdf-clasa4?c=…&mod=fisa|fisa+barem|barem|rezolvate`; printare: `/fisa/clasa4?c=…`.
- La exercițiile cu variante, fișa arată căsuțe de bifat.
- ↻ pe un exercițiu îl înlocuiește (și pe fișa cu rezolvări).

## Jocurile

Aceleași 5 jocuri ca la clasa a III-a (`JocC3`, generalizat): Cursa contra cronometrului, Perechi, Balanța, Detectivul, Constructorul.

- **Balanța** compară mărimi în unități diferite, perimetre și estimări. Celelalte capitole apar ca întrebări obișnuite.
- **Detectivul** caută numărul care lipsește din mărimile compuse („3 km □ m = 3 040 m”).
- **Constructorul** construiește pe grilă dreptunghiuri și pătrate cu perimetrul cerut (capitolul 1).
- **Perechi**: tabelele (și Nivelul 1 de la logică) nu încap pe cartonașe. Se folosesc celelalte capitole alese, iar profesorul vede un avertisment.
- După a doua greșeală, elevul vede răspunsul și **rezolvarea pas cu pas**. Pe ecranul final, exercițiile greșite apar cu rezolvarea.

Ca temă: mecanica `c4:<joc>`. Serverul (`trimiteJocC4`) regenerează exercițiile din cod și din numărul încercării, verifică din nou răspunsurile și salvează punctajul, medalia și capitolele. Raportul de la profesor (semafor, părinți, diplomă, CSV) folosește numele capitolelor de clasa a IV-a.

## Cod

- `src/motor/clasa4/`: `tipuri.ts` (capitole, desene, verificări), `generator.ts`, `config.ts`, `clasa4.test.ts`
- `src/jocuri/c4/DesenC4.tsx`: desenele SVG; `JocuriC4.tsx`: joc liber și temă
- `src/componente/FisaC3.tsx`: fișa comună pentru clasele a III-a și a IV-a (parametrul `clasa`, modul `rezolvate`)
- `scripts/valideaza_clasa4.py`: verificarea independentă

## Verificare

- `npx vitest run src/motor/clasa4`: fiecare capitol × nivel × joc. Verifică răspunsul acceptat, unicitatea, numerele naturale, rezolvarea, configurația din URL și Memory.
- `npm run valideaza:sympy`: exportă ~11 700 de exerciții. SymPy verifică independent:
  - expresiile;
  - sistemele (soluție naturală unică);
  - secolele;
  - estimările;
  - evenimentele.

  Faptele (corpuri, figuri, drepte, etaloane) sunt verificate cu tabele scrise separat, iar numărările prin enumerare completă.
