/**
 * Cursul de engleză pentru 4–6 ani: conținut original (teme clasice pentru vârstă).
 * Copiii nu citesc încă: fiecare cuvânt are o imagine (emoji) și se aude în engleză;
 * textul englezesc apare mic, pentru părinte / educatoare; traducerea română ajută adultul.
 */
export interface Cuvant {
  en: string;
  ro: string;
  /** imaginea (emoji); la numere se desenează `numar` obiecte */
  emoji: string;
  numar?: number;
  /** culoarea (la unitatea „Colours”: pata de culoare) */
  culoare?: string;
}

export interface Unitate {
  id: string;
  titlu: string;
  titluRo: string;
  icon: string;
  culoare: string;
  /** cerința de la „Ascultă și atinge”: {w} = cuvântul */
  cerinta: string;
  /** propoziția model de la cartonașe: {w} = cuvântul */
  fraza: string;
  cuvinte: Cuvant[];
}

export const UNITATI: Unitate[] = [
  {
    id: "colours", titlu: "Colours", titluRo: "Culorile", icon: "🎨", culoare: "#e0483e", cerinta: "Touch {w}!", fraza: "It's {w}.",
    cuvinte: [
      { en: "red", ro: "roșu", emoji: "🍎", culoare: "#e53935" }, { en: "blue", ro: "albastru", emoji: "🐳", culoare: "#1e88e5" },
      { en: "yellow", ro: "galben", emoji: "🌻", culoare: "#fdd835" }, { en: "green", ro: "verde", emoji: "🐸", culoare: "#43a047" },
      { en: "orange", ro: "portocaliu", emoji: "🍊", culoare: "#fb8c00" }, { en: "purple", ro: "mov", emoji: "🍇", culoare: "#8e24aa" },
      { en: "pink", ro: "roz", emoji: "🌸", culoare: "#ec407a" }, { en: "brown", ro: "maro", emoji: "🐻", culoare: "#795548" },
      { en: "black", ro: "negru", emoji: "🐈‍⬛", culoare: "#212121" }, { en: "white", ro: "alb", emoji: "☁️", culoare: "#fafafa" },
    ],
  },
  {
    id: "numbers", titlu: "Numbers 1–10", titluRo: "Numerele 1–10", icon: "🔢", culoare: "#2f6fd1", cerinta: "Touch {w}!", fraza: "I can count to {w}.",
    cuvinte: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"].map((en, i) => ({
      en, ro: ["unu", "doi", "trei", "patru", "cinci", "șase", "șapte", "opt", "nouă", "zece"][i], emoji: "⭐", numar: i + 1,
    })),
  },
  {
    id: "animals", titlu: "Animals", titluRo: "Animalele", icon: "🐾", culoare: "#2e9e5b", cerinta: "Where's the {w}?", fraza: "I can see a {w}.",
    cuvinte: [
      { en: "cat", ro: "pisică", emoji: "🐱" }, { en: "dog", ro: "câine", emoji: "🐶" }, { en: "bird", ro: "pasăre", emoji: "🐦" },
      { en: "fish", ro: "pește", emoji: "🐟" }, { en: "rabbit", ro: "iepure", emoji: "🐰" }, { en: "duck", ro: "rață", emoji: "🦆" },
      { en: "cow", ro: "vacă", emoji: "🐮" }, { en: "horse", ro: "cal", emoji: "🐴" }, { en: "pig", ro: "porc", emoji: "🐷" },
      { en: "sheep", ro: "oaie", emoji: "🐑" },
    ],
  },
  {
    id: "family", titlu: "My family", titluRo: "Familia mea", icon: "👨‍👩‍👧", culoare: "#e07a1f", cerinta: "Where's {w}?", fraza: "This is my {w}.",
    cuvinte: [
      { en: "mum", ro: "mama", emoji: "👩" }, { en: "dad", ro: "tata", emoji: "👨" }, { en: "baby", ro: "bebelușul", emoji: "👶" },
      { en: "grandma", ro: "bunica", emoji: "👵" }, { en: "grandpa", ro: "bunicul", emoji: "👴" }, { en: "sister", ro: "sora", emoji: "👧" },
      { en: "brother", ro: "fratele", emoji: "👦" },
    ],
  },
  {
    id: "body", titlu: "My body", titluRo: "Corpul meu", icon: "🙋", culoare: "#6a59a7", cerinta: "Touch the {w}!", fraza: "Touch your {w}.",
    cuvinte: [
      { en: "eyes", ro: "ochii", emoji: "👀" }, { en: "ear", ro: "urechea", emoji: "👂" }, { en: "nose", ro: "nasul", emoji: "👃" },
      { en: "mouth", ro: "gura", emoji: "👄" }, { en: "hand", ro: "mâna", emoji: "✋" }, { en: "foot", ro: "piciorul (laba)", emoji: "🦶" },
      { en: "leg", ro: "piciorul", emoji: "🦵" }, { en: "tooth", ro: "dintele", emoji: "🦷" },
    ],
  },
  {
    id: "food", titlu: "Food", titluRo: "Mâncarea", icon: "🍎", culoare: "#c62828", cerinta: "Where's the {w}?", fraza: "I want the {w}, please.",
    cuvinte: [
      { en: "apple", ro: "măr", emoji: "🍎" }, { en: "banana", ro: "banană", emoji: "🍌" }, { en: "milk", ro: "lapte", emoji: "🥛" },
      { en: "bread", ro: "pâine", emoji: "🍞" }, { en: "cake", ro: "tort", emoji: "🍰" }, { en: "egg", ro: "ou", emoji: "🥚" },
      { en: "cheese", ro: "brânză", emoji: "🧀" }, { en: "carrot", ro: "morcov", emoji: "🥕" }, { en: "ice cream", ro: "înghețată", emoji: "🍦" },
      { en: "juice", ro: "suc", emoji: "🧃" },
    ],
  },
  {
    id: "toys", titlu: "Toys", titluRo: "Jucăriile", icon: "🧸", culoare: "#00897b", cerinta: "Where's the {w}?", fraza: "It's a {w}.",
    cuvinte: [
      { en: "ball", ro: "minge", emoji: "⚽" }, { en: "teddy bear", ro: "ursuleț", emoji: "🧸" }, { en: "car", ro: "mașinuță", emoji: "🚗" },
      { en: "train", ro: "trenuleț", emoji: "🚂" }, { en: "kite", ro: "zmeu", emoji: "🪁" }, { en: "balloon", ro: "balon", emoji: "🎈" },
      { en: "robot", ro: "robot", emoji: "🤖" }, { en: "doll", ro: "păpușă", emoji: "🪆" }, { en: "plane", ro: "avion", emoji: "✈️" },
    ],
  },
  {
    id: "clothes", titlu: "Clothes", titluRo: "Hainele", icon: "👕", culoare: "#d81b60", cerinta: "Where's the {w}?", fraza: "Put on your {w}.",
    cuvinte: [
      { en: "hat", ro: "pălărie", emoji: "👒" }, { en: "coat", ro: "haină", emoji: "🧥" }, { en: "dress", ro: "rochie", emoji: "👗" },
      { en: "T-shirt", ro: "tricou", emoji: "👕" }, { en: "shoes", ro: "pantofi", emoji: "👟" }, { en: "socks", ro: "șosete", emoji: "🧦" },
      { en: "scarf", ro: "fular", emoji: "🧣" }, { en: "gloves", ro: "mănuși", emoji: "🧤" },
    ],
  },
  {
    id: "weather", titlu: "Weather", titluRo: "Vremea", icon: "🌦️", culoare: "#0288d1", cerinta: "Touch {w}!", fraza: "It's {w}!",
    cuvinte: [
      { en: "sunny", ro: "însorit", emoji: "☀️" }, { en: "rainy", ro: "ploios", emoji: "🌧️" }, { en: "snowy", ro: "ninge", emoji: "❄️" },
      { en: "windy", ro: "bate vântul", emoji: "🌬️" }, { en: "cloudy", ro: "înnorat", emoji: "☁️" }, { en: "stormy", ro: "furtună", emoji: "⛈️" },
    ],
  },
];

export const unitate = (id: string) => UNITATI.find((u) => u.id === id);

export type Varsta = 4 | 5 | 6;
/** câte imagini are copilul de ales: 4 ani → 2, 5 ani → 3, 6 ani → 4 */
export const VARIANTE_VARSTA: Record<Varsta, number> = { 4: 2, 5: 3, 6: 4 };
/** câte runde are un joc: mai puține la cei mici */
export const RUNDE_VARSTA: Record<Varsta, number> = { 4: 6, 5: 8, 6: 10 };
/** perechi la Memory */
export const PERECHI_VARSTA: Record<Varsta, number> = { 4: 3, 5: 4, 6: 6 };

export type ActivitateEn = "cartonase" | "cutia" | "roata" | "asculta" | "cartita" | "baloane" | "perechi" | "sorteaza" | "propozitie";
/** grupa: „invat” (descopăr și spun cuvintele) sau „joc” (jocuri cu stele) */
export const ACTIVITATI_EN: Record<ActivitateEn, { nume: string; icon: string; descriere: string; grupa: "invat" | "joc"; culoare: string }> = {
  cartonase: { nume: "Cartonașe", icon: "🃏", descriere: "Vezi imaginea, asculți cuvântul și îl spui și tu.", grupa: "invat", culoare: "#6a59a7" },
  cutia: { nume: "Deschide cutia", icon: "🎁", descriere: "Fiecare cutie are o surpriză. Ce e înăuntru?", grupa: "invat", culoare: "#e0483e" },
  roata: { nume: "Roata", icon: "🎡", descriere: "Învârte roata și spune cuvântul în engleză.", grupa: "invat", culoare: "#e07a1f" },
  asculta: { nume: "Ascultă și atinge", icon: "👂", descriere: "Asculți cuvântul și atingi imaginea potrivită.", grupa: "joc", culoare: "#2f6fd1" },
  cartita: { nume: "Lovește cârtița", icon: "🔨", descriere: "Lovește cârtița care ține imaginea spusă!", grupa: "joc", culoare: "#8d6e63" },
  baloane: { nume: "Sparge baloanele", icon: "🎈", descriere: "Sparge balonul cu imaginea spusă!", grupa: "joc", culoare: "#ec407a" },
  perechi: { nume: "Perechi", icon: "🧠", descriere: "Întoarce cartonașele și găsește imaginile la fel.", grupa: "joc", culoare: "#00897b" },
  sorteaza: { nume: "Sortează", icon: "🗂️", descriere: "Pune fiecare imagine în coșul potrivit.", grupa: "joc", culoare: "#1fa9bd" },
  propozitie: { nume: "Construiește propoziția", icon: "🧩", descriere: "Ascultă propoziția și pune piesele în ordine.", grupa: "joc", culoare: "#5b3fb8" },
};
/** activitățile cu stele câștigate (cele de „învăț” dau mereu 3 stele la final) */
export const ACTIVITATI_CU_STELE: ActivitateEn[] = ["asculta", "cartita", "baloane", "perechi", "sorteaza", "propozitie"];

/** pictogramele cuvintelor din propoziții (copiii nu citesc: fiecare piesă are o imagine) */
export const ICON_CUVANT: Record<string, string> = {
  "i": "🙋", "i've": "🙋", "it's": "👉", "this": "👉", "is": "🟰", "my": "🫶", "a": "☝️", "the": "👆", "like": "❤️", "want": "🤲", "please": "🙏",
  "can": "💪", "see": "👀", "count": "🔢", "to": "➡️", "got": "🤲", "touch": "✋", "your": "🫵", "put": "🤲", "on": "⬆️",
};

/** textul cerinței cu cuvântul pus („Where's the cat?”) */
export const cuCuvant = (sablon: string, w: string) => sablon.replace("{w}", w);
