"use client";

import { spuneText } from "@/lib/voce";

/** Vocea în engleză a cursului: jucăușă (rar, ton mai înalt), cu reglajele alese de adult. */
export function spune(text: string) {
  spuneText(text, "en");
}

export const LAUDE = ["Well done!", "Great!", "Super!", "Fantastic!", "Good job!"];
