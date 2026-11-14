"use client";

import { useActionState } from "react";
import { FormActiune } from "@/componente/FormActiune";
import { Buton, Camp, CardCentrat, Mesaj } from "@/componente/ui";
import { configurareAdmin } from "@/lib/actiuni-cont";

/** Activarea unui cont de administrator (email din ADMIN_EMAILS) — o singură dată. */
export default function Configurare() {
  const [stare, actiune, pending] = useActionState(configurareAdmin, {});
  return (
    <CardCentrat titlu="Prima configurare" subtitlu="Activează contul de administrator">
      <FormActiune actiune={actiune}>
        <Mesaj eroare={stare.eroare} />
        <Camp label="Email (din lista administratorilor)" name="email" type="email" autoComplete="username" required />
        <div className="grid grid-cols-2 gap-3">
          <Camp label="Prenume" name="prenume" required />
          <Camp label="Nume" name="nume" required />
        </div>
        <Camp label="Alege o parolă (minimum 10 caractere)" name="parola" type="password" autoComplete="new-password" minLength={10} required />
        <Camp label="Repetă parola" name="parola2" type="password" autoComplete="new-password" minLength={10} required />
        <Buton pending={pending}>Activează contul</Buton>
      </FormActiune>
    </CardCentrat>
  );
}
