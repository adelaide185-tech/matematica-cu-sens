"use client";

import { useActionState } from "react";
import { FormActiune } from "@/componente/FormActiune";
import { Buton, Camp, CardCentrat, Mesaj } from "@/componente/ui";
import { schimbaParola } from "@/lib/actiuni-cont";

export default function SchimbaParola() {
  const [stare, actiune, pending] = useActionState(schimbaParola, {});
  return (
    <CardCentrat titlu="Alege o parolă nouă" subtitlu="La prima intrare, înlocuiește parola primită de la școală.">
      <FormActiune actiune={actiune}>
        <Mesaj eroare={stare.eroare} />
        <Camp label="Parola actuală" name="veche" type="password" autoComplete="current-password" required />
        <Camp label="Parola nouă" name="noua" type="password" autoComplete="new-password" minLength={6} required />
        <Camp label="Repetă parola nouă" name="noua2" type="password" autoComplete="new-password" minLength={6} required />
        <Buton pending={pending}>Salvează parola</Buton>
      </FormActiune>
    </CardCentrat>
  );
}
