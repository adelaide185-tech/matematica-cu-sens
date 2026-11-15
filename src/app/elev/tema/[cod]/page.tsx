import Link from "next/link";
import { db, dbConfigurata } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { JocTema } from "@/jocuri/c3/JocTema";
import { cfgTemaC3, exercitiiTema, exercitiiTemaClasa1, temaPentruElev } from "@/lib/teme";
import { dreaptaTable, pentruElev } from "@/motor/clasa1/sesiune";
import { RezolvaTema, type ExercitiuElev } from "./RezolvaTema";
import { TemaClasa1 } from "./TemaClasa1";

export const dynamic = "force-dynamic";

export default async function PaginaTema({ params }: { params: Promise<{ cod: string }> }) {
  const { cod } = await params;
  if (!dbConfigurata) return <Mesaj text="Temele online funcționează când aplicația are conturi." />;
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema) return <Mesaj text={`Nu am găsit tema cu codul „${cod.toUpperCase()}”. Verifică codul primit de la profesor.`} />;
  const trimis = await db.incercare.findFirst({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } }, orderBy: { terminat: "desc" } });
  if (tema.test && trimis) return <Mesaj text={`Ai trimis deja testul „${tema.titlu}”: ${trimis.corecte} din ${trimis.total} corecte.`} />;
  if (tema.mecanica.startsWith("c3:")) return <JocTema cod={tema.cod} titlu={tema.titlu} baza={cfgTemaC3(tema, s.id)} test={tema.test} />;
  if (tema.mecanica === "clasa1") {
    // jocurile clasei I: la elev ajung enunțurile și desenele, fără răspunsuri
    const { cfg, exercitii } = exercitiiTemaClasa1(tema, s.id);
    return (
      <TemaClasa1 cod={tema.cod} titlu={tema.titlu} exercitii={pentruElev(exercitii)} dreapta={dreaptaTable(exercitii, cfg.seed)}
        cronometru={cfg.cronometru} secunde={cfg.secunde} />
    );
  }
  const { cfg, exercitii } = exercitiiTema(tema, s.id);
  // la elev ajung doar enunțurile, nu și răspunsurile (verificarea se face pe server)
  const ex: ExercitiuElev[] = exercitii.map((e) => ({ text: e.text, inainte: e.inainte, coloana: e.coloana, rest: e.raspuns.tip === "rest" }));
  return (
    <RezolvaTema cod={tema.cod} titlu={tema.titlu} exercitii={ex} limitaMinute={tema.limitaMinute} test={tema.test}
      simbol={cfg.simbolInmultire} anterior={trimis ? { corecte: trimis.corecte, total: trimis.total } : null} />
  );
}

function Mesaj({ text }: { text: string }) {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <p className="rounded-3xl bg-hartie p-8 text-lg shadow">{text}</p>
      <Link href="/elev/teme" className="mt-4 inline-block font-semibold text-mov">← Temele mele</Link>
    </main>
  );
}
