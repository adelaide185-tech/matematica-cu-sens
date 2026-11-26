import { db, dbConfigurata } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { filtruClaseProfesor } from "@/lib/teme";
import type { Grupa } from "../calcul/GeneratorCalcul";
import { GeneratorArcade } from "./GeneratorArcade";

export const dynamic = "force-dynamic";

export default async function PaginaArcade() {
  let grupe: Grupa[] = [];
  if (dbConfigurata) {
    const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
    const clase = await db.clasa.findMany({
      where: filtruClaseProfesor(s), orderBy: [{ nivel: "asc" }, { nume: "asc" }],
      select: { id: true, nume: true, elevi: { select: { elev: { select: { id: true, nume: true, prenume: true } } } } },
    });
    grupe = clase.map((c) => ({ id: c.id, nume: c.nume, elevi: c.elevi.map((i) => ({ id: i.elev.id, nume: `${i.elev.nume} ${i.elev.prenume}` })).sort((a, b) => a.nume.localeCompare(b.nume, "ro")) }));
  }
  return <GeneratorArcade grupe={grupe} online={dbConfigurata} />;
}
