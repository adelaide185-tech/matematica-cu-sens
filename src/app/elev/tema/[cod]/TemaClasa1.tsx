"use client";

import { useCallback } from "react";
import { JocClasa1 } from "@/jocuri/clasa1/JocClasa1";
import { trimiteTemaClasa1, verificaPasClasa1 } from "@/lib/actiuni-clasa1";
import type { ExercitiuElevC1, RaspunsElevC1 } from "@/motor/clasa1/tipuri";

/** Tema cu jocurile clasei I: fiecare pas și rezultatul final se verifică pe server. */
export function TemaClasa1({ cod, titlu, exercitii, dreapta, cronometru, secunde }: {
  cod: string; titlu: string; exercitii: ExercitiuElevC1[]; dreapta: Record<number, string[]>; cronometru: boolean; secunde: number;
}) {
  const verifica = useCallback((i: number, dat: unknown, inc: number) => verificaPasClasa1(cod, i, dat, inc), [cod]);
  const termina = useCallback((r: RaspunsElevC1[], timpMs: number) => trimiteTemaClasa1(cod, r, timpMs), [cod]);
  return (
    <JocClasa1 titlu={titlu} exercitii={exercitii} dreapta={dreapta} cronometru={cronometru} secunde={secunde}
      verifica={verifica} termina={termina} inapoi={{ href: "/elev/teme", text: "Temele mele" }} ciorna={`mcs-tema-c1-${cod}`} />
  );
}
