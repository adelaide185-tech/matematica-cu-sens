"use client";

import { useActionState } from "react";
import { FormActiune } from "@/componente/FormActiune";
import { Buton, Camp, Mesaj } from "@/componente/ui";
import { autentificare } from "@/lib/actiuni-cont";

export function FormularAutentificare({ inapoi }: { inapoi: string }) {
  const [stare, actiune, pending] = useActionState(autentificare, {});
  return (
    <FormActiune actiune={actiune}>
      <Mesaj eroare={stare.eroare} />
      <input type="hidden" name="inapoi" value={inapoi} />
      <Camp label="Email" name="email" type="email" autoComplete="username" required autoFocus />
      <Camp label="Parola" name="parola" type="password" autoComplete="current-password" required />
      <Buton pending={pending}>Intră</Buton>
    </FormActiune>
  );
}
