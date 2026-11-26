"use client";

/** Vocea în engleză (sinteza vocală a browserului; preferăm o voce britanică). */
let voce: SpeechSynthesisVoice | null | undefined;
function alegeVoce(): SpeechSynthesisVoice | null {
  if (voce !== undefined && voce !== null) return voce;
  try {
    const toate = speechSynthesis.getVoices();
    voce = toate.find((v) => v.lang === "en-GB") ?? toate.find((v) => v.lang.startsWith("en")) ?? null;
  } catch { voce = null; }
  return voce;
}

export function spune(text: string, viteza = 0.85) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = viteza;
    const v = alegeVoce();
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

export const LAUDE = ["Well done!", "Great!", "Super!", "Fantastic!", "Good job!"];
