"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Reîncarcă datele paginii la câteva secunde (rezultatele elevilor apar fără refresh manual). */
export function Reimprospatare({ secunde = 10 }: { secunde?: number }) {
  const router = useRouter();
  const [ora, setOra] = useState("");
  useEffect(() => {
    setOra(new Date().toLocaleTimeString("ro-RO"));
    const t = setInterval(() => {
      if (document.hidden) return;
      router.refresh();
      setOra(new Date().toLocaleTimeString("ro-RO"));
    }, secunde * 1000);
    return () => clearInterval(t);
  }, [router, secunde]);
  return <span className="nu-printa text-xs text-gray-500" aria-live="polite">● actualizare automată la {secunde} s · ultima: {ora}</span>;
}
