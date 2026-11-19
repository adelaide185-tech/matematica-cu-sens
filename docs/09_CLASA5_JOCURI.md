# Clasa a V-a: fișe, exerciții rezolvate și jocuri

Profesor: `/profesor/clasa5`. Elev: `/elev/clasa5` (jocul liber) și `/elev/tema/<cod>` (temele).

## Capitolele

Fiecare capitol are Nivel 1, Nivel 2 și opțiunea Amestecat.

| Capitol | Nivel 1 | Nivel 2 |
|---|---|---|
| Puterea cu exponent natural | calculul puterilor, a¹ și a⁰, 0ⁿ și 1ⁿ | reguli (produs, cât, putere de putere), ultima cifră, comparare |
| Ordinea operațiilor | × și : înainte de + și −, paranteze rotunde, puteri | paranteze pătrate, puteri, mai mulți pași |
| Factorul comun | a·b + a·c = a·(b + c), termenul care lipsește | a·b − a·c, puteri ale lui 2 |
| Divizibilitate | numărul de divizori, criterii, multipli | cifra lipsă (divizibil cu 9), c.m.m.d.c. |
| Numere prime | prim sau compus | cel mai mare factor prim, suma numerelor prime |
| Metode de rezolvare | reducerea la unitate, mersul invers | proporționalitate inversă, falsa ipoteză, „jumătate și încă” |
| Fracții ordinare | amplificare, simplificare, adunare cu același numitor, fracție dintr-un număr | numitori diferiți, înmulțire, probleme |
| Fracții zecimale | × și : cu 10, 100, 1 000, rotunjire, adunare | transformare din fracție ordinară, înmulțire, media aritmetică |
| Segmente și unghiuri | mijlocul segmentului, puncte coliniare, complement și suplement, bisectoare | raport pe segment, unghiuri în jurul unui punct, unghiuri adiacente |
| Arii și volume | aria pătratului și a dreptunghiului, volumul cubului, unități | m² → cm², ha, volumul cuboidului, perimetrul aflat din arie, arii compuse |

Răspunsurile:
- numerele întregi se scriu pe tastatură;
- fracțiile și numerele zecimale (cu virgulă: 6,25) se aleg dintre variante.

Variantele greșite sunt greșeli tipice, de exemplu 1/3 + 1/3 = 2/6, sau virgula mutată greșit.

## Jocurile

Sunt aceleași 5 jocuri și aceeași fișă ca la clasele a III-a și a IV-a.

- **Balanța** compară puteri, fracții, numere zecimale, expresii și arii.
- **Detectivul** caută numărul care lipsește: exponentul, termenul din factorul comun, amplificarea, transformarea.
- **Constructorul** cere un dreptunghi pe grilă, cu aria dată (Nivel 1) sau cu aria și perimetrul date (Nivel 2). Soluția este unică.
- **Perechi** trece automat la alt capitol ales când un capitol nu are cartonașe.

Temele folosesc mecanica `c5:<joc>`. Răspunsurile se verifică pe server prin `trimiteJocC5`, iar rapoartele apar cu numele capitolelor de clasa a V-a.

## Verificare

- `npx vitest run src/motor/clasa5`:
  - fiecare capitol × nivel × joc;
  - o singură variantă corectă;
  - format românesc pentru zecimale;
  - URL și reproductibilitate.
- `scripts/valideaza_clasa5.py`, inclus în `npm run valideaza:sympy`, verifică 10 000 de exerciții cu SymPy:
  - expresii și valori raționale;
  - divizori, cifre lipsă, prime și factori primi, prin enumerare;
  - sisteme cu soluție unică.
