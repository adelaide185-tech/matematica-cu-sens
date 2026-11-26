# Sclipici (mascota), culorile și vocea jucăușă

## Mascota: Sclipici

**Ilustrația oficială** este imaginea primită de la Fabrica de Inteligență: robot-copil mov cu smoc de păr, vizor cyan, căști, antenă cu beculeț, vestă galbenă cu glugă mov, mănuși mov și adidași argintii. Apare în două variante:
- `public/brand/mascota-scena.jpg`: scena întreagă, pe pagina `/mascota`;
- `public/brand/mascota-portret.jpg`: portretul, pe prima pagină.

**Varianta animată** este un SVG redesenat după ilustrație (`src/componente/Mascota.tsx`), folosit în jocuri. Beculețul din antenă pulsează, ochii clipesc, mascota plutește. Are 4 stări:

| Stare | Când apare |
|---|---|
| `salut` (flutură din mână) | meniul elevului, pagina cursului, la începutul activităților |
| `ganditor` (se uită în sus) | cât timp copilul alege răspunsul |
| `bucuros` (sare, brațele sus) | răspuns corect, perechi găsite, ecranul final cu 2–3 stele |
| `incurajare` (zâmbet blând) | după o greșeală, ecranul final cu puține stele |

**Folosire:**
- `<Mascota stare="bucuros" marime={120} spune="Well done!" />`;
- dacă dispozitivul are reducerea mișcării activată, mascota stă nemișcată.

## Culorile (`src/app/globals.css`, în `@theme`)

Paleta este luată din ilustrație:

| Token | Culoare | Folosire |
|---|---|---|
| `violet` / `violet-inchis` | #5b3fb8 / #3d2689 | titluri, cardul „Mate cu SENS” |
| `lavanda` / `lavanda-deschis` | #f2c5f9 / #fbf0fd | fundaluri |
| `cyan` / `cyan-inchis` | #8be6f2 / #1fa9bd | accente, cardul „Engleză”, strălucirea mascotei |
| `galben` (existent) | #f9c50f | butoane, stele |

**Clase gata făcute:**
- `fundal-fabrica`: gradient lavandă → cyan, ca în ilustrație;
- `card-curs-mate` și `card-curs-engleza`: cardurile cursurilor;
- `portret-mascota`: ramă albă și strălucire cyan.

**Unde se văd:**
- prima pagină;
- pagina mascotei;
- tot cursul de engleză;
- toate meniurile elevului (fundalul e pus în `src/app/elev/(meniu)/layout.tsx`).

Panourile profesorului și fișele tipărite rămân pe alb.

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
