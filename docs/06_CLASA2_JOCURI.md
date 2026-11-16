# Clasa a II-a: mini-jocuri (etapele 1–5)

Implementarea urmează specificația `mate-cu-sens-clasa-2-jocuri.md`. Profesorul configurează jocurile la `/profesor/clasa2`; elevul le găsește la `/elev/clasa2` (joc liber) și la „Temele mele”.

## Etapa 1 – conținutul (`src/motor/clasa2/`)

- **Noțiunile** sunt aceleași ca în antrenament: numerație, operații, probleme, fracții, măsurări, timp, bani.
- **Trei niveluri:**
  - 🐢 Ușor: 0–100, cu desene;
  - 🐇 Mediu: 0–1 000;
  - 🚀 Provocare: trecere la zeci și la sute, căsuțe cu mai multe soluții.
- **Constrângerile programei** (`curataC2` le aplică și la configurația venită din URL):
  - sume ≤ 1 000, produse ≤ 100;
  - împărțiri exacte, cu deîmpărțitul ≤ 100;
  - fracțiile ½ și ¼ (⅓ opțional);
  - unitățile m–cm, l, kg;
  - ceasul din 15 în 15 minute;
  - sume de bani ≤ 100 de lei.
- **Opțiunile profesorului:**
  - fără / cu trecere / oricum, plus „la zeci / la sute / ambele”;
  - forma necunoscutei;
  - tablele;
  - dublul / triplul / jumătatea / sfertul;
  - rotunjirea la zeci sau sute;
  - pasul ceasului;
  - suma maximă de bani.
- **Greșeli tipice etichetate.** Fiecare variantă greșită poartă eticheta greșelii pe care o reprezintă:
  - trecere omisă, împrumut omis;
  - ordin greșit, tabel vecin;
  - operația inversă;
  - acele ceasului inversate, „fără un sfert”;
  - lei ↔ bani, 1 m = 10 cm.

  Răspunsul tastat de elev se clasifică automat după aceste etichete (`clasificaEroare`).
- **Limba română:**
  - numerele 0–1 000 scrise cu litere (`numarInLitere`);
  - ora spusă românește („ora 8”, „8 și un sfert”, „8 și jumătate”, „9 fără un sfert”), cu `oraInLitere`.

## Etapa 2 – jocurile (`src/jocuri/c2/JocC2.tsx`)

| Joc | Ce face copilul | Greșeala |
|---|---|---|
| 🔗 Perechi rapide | Atinge o expresie, apoi rezultatul ei; în dreapta sunt și 2–3 cartonașe fără pereche. | Cartonașele tremură, −1 inimă. |
| 🫧 Bule care cad | Atinge bula cu răspunsul corect. Bula corectă ratată reapare sus. Viteza: Ușor 8 s, Mediu 6 s, Provocare 4 s. | Bula greșită se sparge gri, −1 inimă. |
| 🪜 Scara | Răspunde cu variante sau cu tastatura; urcă o treaptă la fiecare răspuns corect. | Itemul rămâne pe ecran; după a doua greșeală apare un indiciu. |
| ⚖️ Balanța | Alege <, = sau >; balanța se înclină spre partea mai grea. La „Numărul care lipsește” (și la adunare, nivelul Provocare): **echilibrează balanța** punând greutăți (1, 2, 5, 10, 50, 100) pe taler; balanța se mișcă pe loc. Aproximativ o treime din comparații sunt egale. | Balanța se clatină, −1 inimă; după o greșeală apare un indiciu. |
| 📶 Ordonează | Atinge cartonașele în ordine (crescător / descrescător sau zilele și lunile în ordinea din calendar); fiecare se mută în rândul numerotat. La Provocare, numerele au aceeași cifră a sutelor. | Cartonașul tremură, −1 inimă și rămâne pe loc. |
| 🃏 Memorie | Grilă 4×4 (8 perechi), 4×5 la Provocare; spatele cărților are logo-ul Fabrica de Inteligență. Joc de explorare: **fără inimi**. | Contur roșu 1 s, apoi cărțile se întorc. |
| 🕒 Ceasul | **Potrivește**: citește ora de pe ceasul analogic și alege-o dintre 4–6 variante („ora 8”, „8 și jumătate”, „9 fără un sfert”). **Mută acele** (Mediu, Provocare): butoane ▲ ▼ mari pentru ora mică și pentru minutar (din 15 în 15 minute), apoi „Verifică”. Ora 20 e acceptată ca ora 8. | Acele revin, −1 inimă; după prima greșeală: „sus = fix, jos = jumătate”. |
| 🛒 Magazinul | **Plătește exact**: produsul cu preț, portofelul cu bani desenați de noi (bancnote de 1, 5, 10, 50, 100 de lei; monede de 1, 5, 10, 50 de bani), tejgheaua cu suma pusă (se vede pe loc). **Câți bani sunt?**: numără și alege. **Cât rest primești?**: tastează restul, în lei (sau în bani, la Provocare). Ușor: doar lei, până la 20. | Banii se întorc în portofel, −1 inimă. Greșeli tipice: lei ↔ bani, operația inversă. |
| 🧩 Provocarea în imagini | Problemă cu o operație sau cu două (atunci cu întrebarea ajutătoare ca pas intermediar): scena, bara-model parte–întreg, apoi pasul 1 – alege operația (+ − × :), pasul 2 – scrie rezultatul. | Greșeala la operație **nu** costă o inimă: bara-model se evidențiază ca indiciu. Greșeala la rezultat: −1 inimă. |
| 🔤 Integrama numerelor | Integramă mică (Orizontal / Vertical) generată automat în română; indiciile sunt calcule, răspunsurile numerele scrise cu litere (0–20, 30–90). Tastatură cu Ă Â Î Ș Ț; cursorul sare peste literele deja fixate. Diacriticele sunt obligatorii doar la Provocare. Fără inimi. | Cuvântul tremură și se șterge; după 3 încercări se arată. |
| 🎯 Ținte | Țintele cu numere trec prin fața copilului (Ușor 60, Mediu 90, Provocare 130 px/s); ținta corectă ratată revine. | Ținta greșită cade, −1 inimă. |
| 🔲 Completează căsuțele | Completează una sau două căsuțe, cu tastatura de pe ecran. Pentru `□ × □ = 12` sunt acceptate toate soluțiile, iar la final apar celelalte („Mai erau: …”). | Abia după a doua greșeală se arată răspunsul. |

Comun tuturor jocurilor:
- alegerea nivelului (dacă profesorul a ales „copilul alege”);
- 3 sau 5 inimi, ori fără inimi;
- combo 🔥, cu punctaj × 1 / 1,5 / 2 după nivel;
- medalii 🥉🥈🥇💎;
- instrucțiuni de cel mult 6 cuvinte, cu 🔊;
- sunete scurte, opționale;
- respectarea `prefers-reduced-motion`.

Niciun mesaj negativ: la 0 inimi apare „Mai încercăm o dată? 💪”, cu itemi noi.

## Profesorul

Pe `/profesor/clasa2` profesorul alege:
- noțiunile și opțiunile de conținut;
- jocul (sunt marcate doar noțiunile compatibile);
- nivelul și viețile;
- 10–100 de exerciții.

Apoi poate:
- descărca fișa PDF (font mare, 2–3 coloane), cu barem;
- previzualiza jocul ca elev;
- trimite jocul unei grupe sau unui elev.

Serverul verifică din nou fiecare răspuns. Raportul arată, pentru fiecare elev:
- medalia, scorul, acuratețea și timpul;
- greșelile, cu răspunsul dat;
- procentul pe noțiuni;
- secțiunea **Greșeli tipice** (câți elevi și care).

## Validare

```bash
npx vitest run src/motor/clasa2
```

```bash
npm run valideaza:sympy
```

Testele verifică:
- 14 160 de exerciții (joc × noțiune × nivel), cu rezultatul și ecuațiile căsuțelor;
- produsele ≤ 100 și împărțirile exacte;
- regula „fără / cu trecere” 100%, la zeci și la sute;
- soluția unică la căsuțe, sau toate soluțiile listate;
- că nu există duplicate, iar la Perechi nu se repetă nici fețele;
- că variantele greșite nu coincid niciodată cu răspunsul și că greșelile tipice se recunosc.

`scripts/valideaza_clasa2.py` recalculează totul cu SymPy și verifică numerele scrise cu litere și ora cu implementări independente, scrise în Python.

## Etapa 5 – recompense și profesorul

- **🧩 Puzzle-recompensă**: fiecare joc terminat cu ⭐⭐⭐ deblochează o piesă (12 piese dintr-o ilustrație proprie); copilul le așază pe pagina „Jocuri – clasa a II-a” (atinge piesa, apoi locul ei). Puzzle complet = insigna „Puzzle-ul matematicii”. Progresul stă în browserul copilului.
- **🎲 Mix automat**: o temă cu mai multe jocuri la rând, alese după noțiuni: recunoaștere (Perechi / Memorie / Balanța…) → producere (Căsuțe / Scara / Provocarea…) → viteză (Bule / Ținte). Numărul de exerciții se împarte între jocuri.
- **Semaforul pe elevi** (rezultatele temei): ⚪ nu a început · 🟠 are nevoie de sprijin (acuratețe sub 60%, de cel puțin 2 ori fără inimi sau aceeași greșeală tipică de cel puțin 3 ori) · 🔵 pe drumul cel bun · 🟢 se descurcă bine (acuratețe ≥ 80% și medalie). Se calculează din cea mai bună încercare.
- **Recomandări automate**: la fiecare greșeală tipică din grupă, jocul și noțiunea de atribuit (ex. „trecere omisă → Scara cu Adunarea, cu trecere, Mediu”).
- **Raport pentru părinți** (PDF, o pagină pe copil): medalia, stelele, ce știe bine, ce exersăm acasă, 3 exerciții recomandate din noțiunea cea mai slabă, cu răspunsuri.
- **Diplomă** (PDF, A4 orizontal) pentru 🥇 Aur și 💎 Diamant.
- **Export CSV** cu aceleași cifre ca pe ecran (stare, medalie, acuratețe, ce știe, de exersat, greșeli tipice).
