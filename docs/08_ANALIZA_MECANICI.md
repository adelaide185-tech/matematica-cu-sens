# Analiza mecanicilor de joc din Eduten (clasele I–IV)

Notițe din contul de profesor Eduten (playground.eduten.com), citit pe 19 noiembrie 2026. Am deschis cele 4 cursuri din cont (clasele I, II, III, IV) și am încercat câteva exerciții în modul de previzualizare. **Clasa a V-a nu există în cont**, așa că nu apare aici.

Textele sunt rezumate cu cuvintele noastre. Nu am copiat enunțuri, indicii sau descrieri din Eduten.

## 1. Cum e organizată o lecție

- Un curs = o clasă. Programa are între 23 (clasa I) și 48 (clasa a II-a) de lecții gata făcute. Profesorul le adaugă în „Lecțiile mele”.
- O lecție are 18–24 de exerciții, cu un timp estimat (cam 2 minute pe exercițiu: 22 de exerciții ≈ 44 min).
- Exercițiile sunt ordonate de la ușor la greu. Fiecare are o etichetă:
  - **Ușor** → **Moderat** → **Dificil** (treapta de dificultate);
  - etichete speciale: **Problemă** (puzzle la final), **Programare** (gândire algoritmică), **Audio** (enunț ascultat), **Revizuire** (recapitulare din lecții mai vechi).
- Profesorul poate ascunde o lecție de elevi (iconița cu ochi; lecțiile ascunse se strâng într-o secțiune separată).
- Fiecare exercițiu are un buton „Ascultă”: enunțul e citit cu voce tare. E util la clasa I, unde elevii încă nu citesc fluent.

## 2. Tipuri de exerciții

Le-am grupat după ce face elevul, nu după nume.

### 2a. Exerciții „de fișă” (fără timp)

| Mecanică | Ce face elevul | Unde am văzut-o |
|---|---|---|
| Clasificare | trage cartonașe în categorii (ex. numere după ordinul cel mai mare) | IV, II |
| Conectează perechile / Joc de memorie | unește două reprezentări ale aceluiași lucru; varianta memorie are cartonașele întoarse | II, III, IV |
| Ordonare | așază numere crescător sau formează cel mai mare număr din cifre | IV |
| Completează tabelul / spațiul liber / șirul | scrie numărul care lipsește | I–IV |
| Test cu variante | alege un răspuns din 3–4 (uneori cu imagini) | I–IV |
| Exercițiu cu expresii, Compunerea numerelor | construiește un număr sau o expresie din bucăți | IV |
| Rotunjire, „Care e regula?” | aplică sau descoperă o regulă | IV |
| Linie numerică, cuburi, bețe de chibrit | manipulative virtuale: numără, construiește, plasează pe axă | I |
| Probleme cu text | problemă cu enunț, răspuns numeric | II–IV |

### 2b. Mini-jocuri arcade (cu timp)

Aceleași câteva motoare de joc revin la toate clasele; se schimbă doar întrebările.

| Joc | Mecanică |
|---|---|
| Obiecte zburătoare | cerința apare într-un nor, elevul alege una din 4 variante (clic sau tastele 1–4) |
| Cursa / Racer | o mașină pe șosea; răspunsurile vin pe porți, elevul trece prin poarta corectă |
| Shipster | o navă spațială; numărul-țintă e jos, elevul trage în bulele potrivite |
| Scara / Ladder | urcă o treaptă la fiecare răspuns corect |
| Duck hunt, Snake, Numere în cădere | variante de „prinde răspunsul corect” cu mișcare |

Înainte de start, jocurile arcade cer **nivelul de provocare**: Începător / Intermediar / Expert (vitezometru cu 3 trepte). Nivelul schimbă viteza, nu conținutul.

### 2c. Puzzle-uri de programare

- „Lumea Eduten”: elevul pune săgeți de mișcare într-un program cu 15 locuri, apasă „Execută” și o mașinuță merge pe hartă până la linia de sosire. Viteza animației se poate regla.
- La clasele mici: „găsește ce e la fel / ce nu se potrivește”, „copiază modelul”, „continuă modelul”.

## 3. Punctaj

- **Fiecare exercițiu valorează 30 de puncte**, indiferent de tip sau dificultate (fereastra „Informații” arată „Scor: –/30” înainte de rezolvare).
- Un exercițiu are mai multe runde (bara de progres de sus are 5–10 segmente). Un răspuns corect umple un segment și trece direct la runda următoare.
- Scorul unei lecții = suma exercițiilor. Profesorul vede scorul, precizia, exercițiile începute și timpul pentru fiecare elev, împărțite pe Ușor / Moderat / Dificil.

## 4. Vieți (inimioare)

- Fiecare exercițiu pornește cu **3 inimioare** (colțul din dreapta sus).
- O verificare greșită costă o inimioară, atât la exercițiile de fișă, cât și la jocuri.
- În previzualizare, jocul a continuat și cu 0 inimioare (s-a generat o rundă nouă, cu variantele amestecate). Probabil inimioarele pierdute scad punctajul, nu opresc jocul. Nu am putut verifica pe un cont de elev.

## 5. Feedback

- **Corect**: fără mesaj. Segmentul de progres se face verde și apare imediat runda următoare.
- **Greșit la exercițiile de fișă**: bară roșie, mesaj scurt de încurajare și un **indiciu cu numărul de elemente puse corect** („ai pus bine X din Y”). Butonul devine „Încearcă din nou”, iar elementele corecte rămân pe loc.
- **Greșit la jocuri**: varianta aleasă se colorează în roșu și se pierde o inimioară. Nu apare niciun mesaj, jocul continuă.
- Nu apare rezolvarea pas cu pas. Feedbackul îi spune elevului *cât* a greșit, nu *de ce*.

## 6. Trofee și motivare

- 4 trofee, afișate pe clasă: **Bronz, Argint, Aur, Diamant**, fiecare cu un contor.
- Pragurile pentru trofee nu apar în interfața de profesor. Din ce arată analiza (filtrul „Fără trofeu” și reperele de precizie 70% / 90%), probabil depind de precizie și scor, dar nu e confirmat.
- Profesorul poate genera **diplome** și un **raport pentru părinți** (cu termen de trimitere).

## 7. Ce vede profesorul (analiza lecției)

- Precizie medie, cu repere la 70% și 90%; numărul mediu de sarcini terminate; timpul mediu pe elev; câți elevi sunt activi.
- Cele mai grele și cele mai ușoare exerciții.
- Progresul fiecărui elev, cu filtre: alertă, gata, precizie scăzută, fără trofeu.
- **Abilități**: fiecare exercițiu e legat de abilități din programă. Profesorul vede procentul de elevi pe niveluri (necesită exersare / mediu / ridicat) și cât de des apare fiecare abilitate în lecție.
- Grafic cu trimiterile în timp și scorul cumulat.
- Pe tabloul de bord: **Sârguința elevului** (nicio activitate / necesită suport / se descurcă bine) și **Recomandări** automate.

## 8. Ce putem prelua în Mate cu Sens

Comparat cu ce avem deja (`docs/05`–`07`: Cursa contra cronometrului, Perechi, Balanța, Detectivul, Constructorul):

1. **Punctaj fix pe exercițiu** (de exemplu 30), cu mai multe runde. Scorurile se pot compara ușor între jocuri.
2. **3 vieți pe exercițiu**, care scad scorul, dar nu opresc jocul. Se potrivește cu regula noastră „după a doua greșeală arătăm rezolvarea”.
3. **Indiciu numeric la exercițiile cu mai multe elemente** („ai pus bine 4 din 6”). ✅ *Făcut:* apare la integramă (litere), la căsuțele de clasa a II-a cu o singură soluție și la împărțirea cu rest (clasele III–IV), după prima greșeală, înaintea indiciului obișnuit (`src/motor/cateBune.ts`). Perechi și Ordonare verifică fiecare element pe loc, așa că acolo nu se aplică.
4. **Etichete de dificultate vizibile** (Ușor / Moderat / Dificil) și o lecție ordonată în trepte. Se potrivește cu Nivel 1 / Nivel 2 / Amestecat de la noi.
5. **Nivel de provocare doar pentru viteză** la jocurile cu timp (Cursa contra cronometrului). Conținutul rămâne același.
6. **Buton „Ascultă”** la clasele I–II.
7. **Trofee pe clasă** (bronz → diamant) cu praguri publice. Aici putem face mai bine decât Eduten: să le spunem elevilor ce trebuie să facă pentru fiecare trofeu.
8. **Ce face Eduten mai slab, iar noi deja facem**: Eduten nu arată rezolvarea pas cu pas după greșeli. Asta rămâne un avantaj al nostru.
