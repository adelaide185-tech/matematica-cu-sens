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

## Activitățile (`src/engleza/Activitati.tsx`)

- **🃏 Cartonașe**: imaginea mare și cuvântul, care se aude la fiecare atingere. Butonul „💬 Cu propoziție” trece de la cuvânt la propoziția model. Sunt potrivite și pentru proiector, în clasă.
- **👂 Ascultă și atinge**:
  - copilul aude cerința și atinge imaginea;
  - la o greșeală, aude ce a atins („That's a dog. Try again!”);
  - după două greșeli, imaginea corectă pulsează, ca ajutor;
  - pe ecran, cerința apare pe butonul 🔊, care o repetă.
- **🧠 Perechi**: cartonașe întoarse; la fiecare întoarcere se aude cuvântul.

**Stelele:**
- Copilul primește mereu cel puțin o stea, pentru că la vârsta asta contează efortul.
- La „Ascultă și atinge”, 3 stele înseamnă cel mult o greșeală.
- La „Perechi”, 3 stele înseamnă cel mult două mutări pe pereche.

Pe pagina cursului, fiecare unitate arată cele 6 stele posibile (3 de la „Ascultă și atinge”, 3 de la „Perechi”). Progresul se salvează în cont sub numele `en-<unitate>-<activitate>`, cu „clasa” 0.

## Verificare

- `npx vitest run src/engleza`:
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
