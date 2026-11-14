"use client";

import { startTransition, useRef } from "react";

/**
 * Formular pentru acțiuni de server care NU golește câmpurile la eroare
 * (comportamentul implicit din React 19). Se golește doar când acțiunea reușește.
 */
export function FormActiune({ actiune, children, className, confirmare }: {
  actiune: (f: FormData) => void | Promise<unknown>;
  children: React.ReactNode;
  className?: string;
  confirmare?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmare && !confirm(confirmare)) return;
        const date = new FormData(e.currentTarget);
        startTransition(() => {
          actiune(date);
        });
      }}
    >
      {children}
    </form>
  );
}
