# Clasa a II-a: mini-jocuri (etapele 1–3)

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
- 11 280 de exerciții (joc × noțiune × nivel), cu rezultatul și ecuațiile căsuțelor;
- produsele ≤ 100 și împărțirile exacte;
- regula „fără / cu trecere” 100%, la zeci și la sute;
- soluția unică la căsuțe, sau toate soluțiile listate;
- că nu există duplicate, iar la Perechi nu se repetă nici fețele;
- că variantele greșite nu coincid niciodată cu răspunsul și că greșelile tipice se recunosc.

`scripts/valideaza_clasa2.py` recalculează totul cu SymPy și verifică numerele scrise cu litere și ora cu implementări independente, scrise în Python.

## Urmează (etapele 4–5)

- Ceasul cu ace, Magazinul;
- Provocarea în imagini, Integrama, Ținte, puzzle-ul de recompensă;
- ecranul „Mix automat”, semaforul pe elevi, raportul pentru părinți și diploma.
