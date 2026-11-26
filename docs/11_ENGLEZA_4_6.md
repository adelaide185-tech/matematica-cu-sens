# Engleză 4–6 ani

Cursul se deschide din meniul „📚 Cursuri” → Engleză, la pagina `/engleza`, și merge fără cont. Dacă elevul este conectat, stelele lui se salvează și în cont.

**Conținutul este original.** Folderul public din Drive („Resources to Learn English”) conține manuale comerciale și jocuri Flash, pe care nu le-am copiat. Am preluat doar temele obișnuite pentru vârsta 4–6 ani.

## Principiul

Copiii de 4–6 ani nu citesc încă, așa că totul se bazează pe ascultare:
- cuvântul se aude în engleză (vocea browserului, de preferință una britanică);
- imaginea este mare;
- copilul atinge imaginea potrivită.

Textul englezesc și traducerea apar mici, pentru părinte sau educatoare.

## Vârsta (se alege pe pagina cursului și rămâne memorată)

| Vârsta | Imagini de ales | Runde la „Ascultă și atinge” | Perechi |
|---|---|---|---|
| 4 ani | 2 (doar primele 6 cuvinte ale unității) | 6 | 3 |
| 5 ani | 3 | 8 | 4 |
| 6 ani | 4 | 10 | 6 |

## Unitățile (`src/engleza/continut.ts`)

1. Colours
2. Numbers 1–10
3. Animals
4. My family
5. My body
6. Food
7. Toys
8. Clothes
9. Weather

Fiecare unitate are 6–10 cuvinte, o propoziție model („It's a cat.”) și o cerință („Where's the cat?”).

## Activitățile (9 în fiecare unitate)

Activitățile sunt făcute după modelul jocurilor Wordwall pe care le folosește aplicația „Axe English” (am analizat-o fără s-o rulăm). Conținutul și desenele sunt originale. La fiecare activitate, Sclipici reacționează la ce face copilul, iar acțiunile au sunete scurte.

**📖 Învăț cuvintele** (fără greșeli; la final, 3 stele și „✓ făcut”):
- **🃏 Cartonașe**: imaginea mare și cuvântul, cu propoziția model.
- **🎁 Deschide cutia**: cutii-cadou numerotate. Fiecare se deschide cu o surpriză: imaginea, cuvântul și propoziția, plus „Say it!”.
- **🎡 Roata**: copilul învârte roata cu imagini. Unde se oprește, aude „What's this? … It's a cat! Say: cat!” și apasă „✅ Am spus!”.

**🎮 Mă joc** (cu stele; 3 stele înseamnă cel mult o greșeală):
- **👂 Ascultă și atinge**: copilul aude cerința și atinge imaginea potrivită.
- **🔨 Lovește cârtița**: cârtițele ies din găuri cu imagini, iar copilul o lovește pe cea spusă. La 4 ani sunt 4 găuri, la 5–6 ani 6 găuri.
- **🎈 Sparge baloanele**: baloane colorate care plutesc. Copilul îl sparge pe cel spus („Pop the cat!”).
- **🧠 Perechi**: cartonașe întoarse, iar fiecare se aude când e întors.
- **🗂️ Sortează**: imagini din două unități („Animals or Food?”). Copilul le pune în coșul potrivit, atingând imaginea și apoi coșul, sau trăgând-o cu degetul.
- **🧩 Construiește propoziția**, după modelul jocului „Phrase Maker”:
  - copilul aude propoziția unității („I can see a cat.”) și pune piesele în ordine;
  - fiecare piesă are o pictogramă (🙋 I, 👀 see…) sau imaginea cuvântului;
  - printre piese se află și o imagine-capcană;
  - la 4 ani sunt 2 piese, la 5 ani cel mult 4, la 6 ani fiecare cuvânt e o piesă.

**Stele:** după 2 greșeli, imaginea corectă pulsează, ca ajutor. Pe pagina cursului, fiecare unitate are o bară de progres cu stelele câștigate, cel mult 18 (6 jocuri × 3).

Codul jocurilor e în `src/engleza/JocuriVii.tsx`, logica în `src/engleza/runde.ts`, iar sunetele în `src/engleza/sunete.ts` (generate în browser, fără fișiere).

## Verificare

- `npx vitest run src/engleza` (inclusiv `jocuri-vii.test.ts`):
  - cuvinte și imagini distincte în fiecare unitate;
  - rundele potrivite pentru fiecare vârstă;
  - aceleași runde pentru același seed.
- **Testul în browser:**
  - meniul Cursuri → Engleză;
  - alegerea vârstei;
  - „Ascultă și atinge” jucat până la final;
  - Perechi și Cartonașe;
  - stelele afișate pe pagina cursului și salvate în contul elevului;
  - 0 erori în consolă.

## Fișe de lucru pentru educatoare (`/profesor/engleza`)

Generatorul se deschide din panoul profesorului („Fișe English 4–6 ani”) sau de pe pagina cursului („🖨️ Pentru educatoare: fișe de lucru”). Educatoarea alege:
- vârsta copiilor;
- temele (din cele 9 unități);
- tipurile de exerciții;
- antetul (titlu, grădinița sau grupa, numele educatoarei, data);
- dacă printează color sau alb-negru.

Fișa folosește doar imagini, fără text de citit pentru copii. Fiecare cerință are o pictogramă și textul ei în engleză și în română, pentru adult.

| Exercițiu | Ce face copilul |
|---|---|
| 👂⭕ Listen and circle | încercuiește imaginea spusă de educatoare (2, 3 sau 4 imagini pe rând, după vârstă) |
| 🌑 Match the picture and its shadow | unește imaginea cu silueta ei |
| 🖍️ Listen and colour | colorează imaginea (gri deschis) cu culoarea spusă („Colour the cat brown.”) |
| 🔢⭕ Count and circle | numără obiectele și încercuiește numărul (1–5 / 1–7 / 1–10, după vârstă) |
| ❌ Cross out the odd one | taie imaginea din altă temă (trei din aceeași temă și una din alta) |
| ✏️ Trace the word | scrie peste literele punctate (recomandat la 6 ani) |

**Fișa educatoarei** are o pagină separată pentru fiecare fișă, cu:
- textul de citit cu voce tare la fiecare exercițiu („Where's the duck?”, „Colour the cat brown.”);
- răspunsurile.

**Descărcare și printare:**
- PDF-ul are două variante: fișa copiilor sau fișa copiilor plus fișa educatoarei, pe `/api/pdf-engleza`. Doar profesorii pot descărca PDF-ul.
- Pagina de printare este `/fisa/engleza`.

**Alte controale:** „🎲 Alte exerciții” face o fișă nouă, iar ↻ pe un exercițiu îi schimbă doar imaginile acestuia.

**Teste:** `src/engleza/fise.test.ts` verifică toate vârstele, toate temele și toate tipurile:
- la „Listen and circle”, imagini diferite pe un rând, cu imaginea cerută o singură dată;
- la umbre, aceleași imagini ca în stânga, amestecate;
- la intrus, o singură imagine din altă temă;
- la numărat, numerele în limitele vârstei;
- aceleași exerciții pentru același cod;
- ↻ schimbă doar exercițiul ales.
