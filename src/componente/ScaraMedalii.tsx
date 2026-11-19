import { CERINTE_MEDALII, MEDALII, ORDINE_MEDALII, urmatoareaMedalie, type Medalie } from "@/motor/clasa3/generator";
import { cuSubstantiv } from "@/motor/limba";

/** Pe ecranul final: cele 4 medalii cu ce cere fiecare, cea câștigată aprinsă, și ce mai trebuia pentru următoarea. */
export function ScaraMedalii({ puncte }: { puncte: { medalie: Medalie; procent: number; scorMax: number } }) {
  const castig = puncte.medalie ? ORDINE_MEDALII.indexOf(puncte.medalie) : -1;
  const urm = urmatoareaMedalie(puncte);
  return (
    <div className="mt-4">
      <ol className="grid grid-cols-4 gap-2" aria-label="Medaliile și ce cer">
        {ORDINE_MEDALII.map((m, i) => (
          <li key={m} className={`rounded-2xl p-2 ${i === castig ? "bg-galben-deschis ring-4 ring-galben" : i < castig ? "bg-mov-deschis" : "bg-gray-50"}`}>
            <div className={`text-3xl ${i <= castig ? "" : "opacity-30 grayscale"}`} aria-hidden>{MEDALII[m].icon}</div>
            <div className="text-sm font-bold text-mov-inchis">{MEDALII[m].nume}</div>
            <div className="text-xs text-gray-600">{CERINTE_MEDALII[m]}</div>
          </li>
        ))}
      </ol>
      {urm && (
        <p className="mt-2 text-lg font-semibold text-mov-inchis">
          Pentru {MEDALII[urm.medalie].icon} {MEDALII[urm.medalie].nume}:{" "}
          {urm.lipsa === null ? "toate răspunsurile corecte din prima." : urm.lipsa === 1 ? "încă un răspuns corect din prima." : `încă cel puțin ${cuSubstantiv(urm.lipsa, "răspuns", "răspunsuri")} corecte din prima.`}
        </p>
      )}
    </div>
  );
}
