"use client";

import { useEffect } from "react";

export function BaraPrint() {
  // venit de la „PDF” fără generator pe server: deschidem direct dialogul de printare
  useEffect(() => {
    if (new URLSearchParams(location.search).get("tipareste") === "1") setTimeout(() => window.print(), 600);
  }, []);
  return (
    <div className="nu-printa mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-2">
      <button onClick={() => history.back()} className="rounded-xl px-4 py-2 font-semibold text-mov hover:bg-mov-deschis">← Înapoi</button>
      <button onClick={() => window.print()} className="rounded-xl bg-mov px-5 py-2 font-bold text-white hover:bg-mov-inchis">🖨️ Printează</button>
    </div>
  );
}
