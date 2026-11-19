import { db, dbConfigurata } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { filtruClaseProfesor } from "@/lib/teme";
import type { Grupa } from "../calcul/GeneratorCalcul";
import { GeneratorClasa1 } from "./GeneratorClasa1";

export const dynamic = "force-dynamic";

export default async function PaginaClasa1() {
  let grupe: Grupa[] = [];
  if (dbConfigurata) {
    const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
    const clase = await db.clasa.findMany({
      where: filtruClaseProfesor(s),
      orderBy: [{ nivel: "asc" }, { nume: "asc" }],
      select: { id: true, nume: true, nivel: true, elevi: { select: { elev: { select: { id: true, nume: true, prenume: true } } } } },
    });
    // grupele de clasa I primele
    grupe = clase.sort((a, b) => Number(b.nivel === 1) - Number(a.nivel === 1)).map((c) => ({
      id: c.id, nume: c.nume,
      elevi: c.elevi.map((i) => ({ id: i.elev.id, nume: `${i.elev.nume} ${i.elev.prenume}` })).sort((a, b) => a.nume.localeCompare(b.nume, "ro")),
    }));
  }
  return <GeneratorClasa1 grupe={grupe} online={dbConfigurata} />;
}
