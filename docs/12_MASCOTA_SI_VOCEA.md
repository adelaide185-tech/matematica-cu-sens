# Sclipici (mascota) și vocea jucăușă

## Mascota: Sclipici

Sclipici este un beculeț galben, desenat original în SVG (`src/componente/Mascota.tsx`). Are:
- „creierul” și razele mov din logo-ul Fabricii de Inteligență;
- ochi mari care clipesc, obraji rozalii, brațe;
- un soclu mov pe post de corp.

Pagina de prezentare este `/mascota`.

| Stare | Când apare |
|---|---|
| `salut` (flutură din mână) | prima pagină, meniul elevului, pagina cursului, la începutul activităților |
| `ganditor` (se uită în sus) | cât timp copilul alege răspunsul |
| `bucuros` (sare, ochii zâmbesc) | răspuns corect, perechi găsite, ecranul final cu 2–3 stele |
| `incurajare` (zâmbet blând) | după o greșeală, ecranul final cu puține stele |

**Folosire:**
- `<Mascota stare="bucuros" marime={120} spune="Well done!" />`, unde `spune` adaugă un balon de vorbire;
- dacă dispozitivul are reducerea mișcării activată, mascota stă nemișcată.

**Unde apare acum:**
- prima pagină;
- meniul elevului;
- cursul de engleză (pagina cursului, Cartonașe, Ascultă și atinge, Perechi, ecranul final);
- finalul jocurilor de clasele III–V și al jocurilor arcade.

## Vocea (`src/lib/voce.ts`)

Vocea este sinteza vocală a browserului, cu reglaje pentru copii:
- **Engleză:** viteza 0,72 (rar) și tonul 1,35 (mai înalt, jucăuș).
- **Română:** viteza 0,9 și tonul 1,2. Așa vorbesc jocurile de matematică (clasele I–V și arcade).

**Vocea se alege automat**, în această ordine:
1. vocile de copil de pe Microsoft Edge („Maisie”, „Ana”);
2. voci feminine: Libby, Sonia, Hazel, Google UK English Female, apoi altele;
3. vocile bărbătești, la urmă.

**Reglaje pentru adult:** pe pagina cursului de engleză, butonul „⚙️ Vocea” permite alegerea vocii, a vitezei și a tonului, plus „🔊 Ascultă”. Reglajele se păstrează în browser.

**Limita:** vocile disponibile depind de dispozitiv și de browser. Pentru o voce identică pe toate dispozitivele ar trebui înregistrări audio, făcute de o persoană sau cu un serviciu de voce, puse ca fișiere în aplicație.
