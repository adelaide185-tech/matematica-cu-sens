# Jocurile arcade (clasele I–V)

Elevul le găsește pe cardul „Jocuri arcade” din meniu, la pagina `/elev/arcade`. Acolo alege:
- clasa (I–V);
- viteza: 🐢 Începător, 🐇 Intermediar, 🐆 Expert;
- exercițiile: Ușor, Mediu sau Greu;
- câte întrebări: 5, 10, 15 sau 20.

Mecanicile pornesc de la analiza din `docs/08_ANALIZA_MECANICI.md`, dar jocurile și grafica sunt ale noastre.

| Joc | Ce face elevul | Comenzi |
|---|---|---|
| 🎈 Baloanele | baloanele cu răspunsuri urcă; elevul îl sparge pe cel corect înainte să zboare | atingere / clic, tastele 1–4 |
| 🏎️ Cursa cu porți | porțile cu răspunsuri coboară spre mașină; trece prin poarta corectă | atingere pe bandă, săgeți ← →, Enter / „⚡ Accelerează” |
| 🚀 Racheta | meteoriții coboară; racheta îl lovește cu laserul pe cel corect | atingere / clic, tastele 1–4 |

## Pentru profesor: previzualizare și temă

Pagina este `/profesor/arcade`, cu cardul „🕹️ Jocuri arcade” din panoul profesorului.

**Ce alege profesorul:** clasa (I–V), jocul, viteza, dificultatea și numărul de întrebări (5–20). Pagina arată întrebările cu varianta corectă marcată. Mai are două butoane:
- „🎲 Alte întrebări”;
- „▶ Previzualizează jocul ca elev”: previzualizarea nu salvează nimic.

**Trimiterea ca temă** folosește aceleași opțiuni ca la celelalte jocuri:
- grupa sau un elev;
- termen și limită de timp;
- „Test: o singură trimitere”;
- alte exerciții pentru fiecare elev.

Tema are mecanica `arc:<joc>`, iar configurația ei este clasa, viteza, dificultatea, numărul de întrebări și codul.

**La elev:**
- tema se deschide din „Temele mele” sau cu codul primit;
- la final, se trimit **alegerile** de la fiecare întrebare, nu punctajul;
- „Mai joc o dată” aduce alte întrebări;
- la test nu există „Mai joc o dată”, iar elevul vede rezultatul (medalia, exercițiile de exersat) până pleacă din pagină.

**Serverul** (`trimiteJocArcade`):
- regenerează întrebările din cod și numărul încercării;
- recalculează greșelile din alegeri (`greseliDinAlegeri`), apoi punctajul, stelele și medalia;
- nu are încredere în ce calculează browserul.

**Raportul la profesor** este cel obișnuit:
- semafor, medalie, scor, seria cea mai lungă;
- exercițiile greșite (cu prima greșeală a elevului);
- rezultatele pe capitole: la clasele III–V cu numele capitolelor, la I–II cu numele generatoarelor;
- raportul pentru părinți și diploma.

## Reguli comune (`src/motor/arcade/scor.ts`)

- **Punctajul:** 30 de puncte pe întrebare, cu 3 inimioare.
- **O greșeală** costă o inimioară (10 puncte). Același lucru se întâmplă dacă obiectele scapă. Runda se reia cu variantele amestecate. **Jocul nu se oprește.**
- **După a doua greșeală**, apar răspunsul corect și rezolvarea, iar întrebarea primește 0 puncte.
- **Stelele:** 1 de la 50%, 2 de la 70%, 3 de la 90%.
- **Medaliile:**
  - 🥉 Bronz, 🥈 Argint, 🥇 Aur (aceleași praguri);
  - 💎 Diamant, dacă toate întrebările sunt corecte din prima.

  Pragurile sunt scrise pe ecranul final.
- **Viteza** schimbă doar cât timp au obiectele până ies din ecran, nu și exercițiile.
- **Alte controale:**
  - „⏸ Pauză” (și tasta P) oprește tot;
  - jocul intră singur în pauză când elevul iese din tab;
  - 🔊 citește întrebarea cu voce tare.
- **Fără animații:** dacă dispozitivul are „reducerea mișcării” activată, obiectele stau pe loc și nu există limită de timp.
- **Progresul** se salvează în cont (`/api/progres`, sub numele `arc-<joc>`), iar stelele apar pe pagina jocurilor arcade.

## De unde vin întrebările (`src/motor/arcade/intrebari.ts`)

- **Clasele I–II:** generatoarele generale (operații, termenul necunoscut, compararea, numerele scrise cu litere, rotunjirea, problemele cu o operație sau două). Se folosesc doar cerințele fără desen.
- **Clasele III, IV, V:** motoarele pe capitole, validate cu SymPy. Se folosesc doar exercițiile scurte (cel mult 110 caractere) și fără desen.
- **Variantele greșite** sunt apropiate de răspuns: ±1, ±10, cifrele inversate, iar la împărțire câtul sau restul greșit. Răspunsul corect apare o singură dată, într-o poziție aleatoare (verificat statistic).

## Verificare

- `npx vitest run src/motor/arcade`:
  - 20 de întrebări valide pentru fiecare clasă și dificultate;
  - aceleași întrebări pentru același seed;
  - punctajul, stelele și medaliile.
- **Testul în browser:**
  - toate cele 15 combinații clasă × joc, jucate până la final, cu progresul salvat;
  - obiectele care scapă, rezolvarea după două greșeli și pauza;
  - mașina mutată din săgeți;
  - 0 erori în consolă.
