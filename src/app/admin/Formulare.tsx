"use client";

import { useActionState } from "react";
import { FormActiune } from "@/componente/FormActiune";
import { Buton, Camp, Mesaj } from "@/componente/ui";
import { creeazaClasa, creeazaProfesor, importaElevi, reseteazaParola, type ContNou, type StareAdmin } from "@/lib/actiuni-admin";
import { scrieCsv } from "@/lib/csv";

export function FormClasa({ profesori }: { profesori: { id: string; nume: string }[] }) {
  const [st, act, pending] = useActionState(creeazaClasa, {} as StareAdmin);
  return (
    <FormActiune actiune={act}>
      <Mesaj eroare={st.eroare} ok={st.ok} />
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Nivel</span>
        <select name="nivel" required className="w-full rounded-xl border-2 border-mov/20 p-2.5">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Clasa {["I", "a II-a", "a III-a", "a IV-a", "a V-a"][n - 1]}</option>)}
        </select>
      </label>
      <Camp label="Nume (ex.: a II-a B, Grupa Mate cu Sens 2)" name="nume" required />
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Profesor</span>
        <select name="profesorId" className="w-full rounded-xl border-2 border-mov/20 p-2.5">
          <option value="">— mai târziu —</option>
          {profesori.map((p) => <option key={p.id} value={p.id}>{p.nume}</option>)}
        </select>
      </label>
      <Buton pending={pending}>Creează clasa</Buton>
    </FormActiune>
  );
}

export function FormProfesor() {
  const [st, act, pending] = useActionState(creeazaProfesor, {} as StareAdmin);
  return (
    <FormActiune actiune={act}>
      <Mesaj eroare={st.eroare} ok={st.ok} />
      <div className="grid grid-cols-2 gap-2">
        <Camp label="Prenume" name="prenume" required />
        <Camp label="Nume" name="nume" required />
      </div>
      <Camp label="Email" name="email" type="email" required />
      <Buton pending={pending}>Creează contul</Buton>
      {st.conturi && <ConturiNoi conturi={st.conturi} />}
    </FormActiune>
  );
}

export function FormImport({ clase }: { clase: { id: string; nume: string }[] }) {
  const [st, act, pending] = useActionState(importaElevi, {} as StareAdmin);
  return (
    <FormActiune actiune={act}>
      <Mesaj eroare={st.eroare} ok={st.ok} />
      {st.erori && st.erori.length > 0 && (
        <ul className="mb-3 max-h-32 overflow-auto rounded-xl bg-galben-deschis p-3 text-xs">{st.erori.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Clasa</span>
        <select name="clasaId" required className="w-full rounded-xl border-2 border-mov/20 p-2.5">
          {clase.length === 0 && <option value="">Creează întâi o clasă</option>}
          {clase.map((c) => <option key={c.id} value={c.id}>{c.nume}</option>)}
        </select>
      </label>
      <label className="mb-2 block text-sm">
        <span className="mb-1 block font-semibold text-gray-700">Fișier CSV (nume, prenume, email)</span>
        <input type="file" name="fisier" accept=".csv,text/csv,text/plain" className="text-sm" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-semibold text-gray-700">…sau lipește lista aici</span>
        <textarea name="text" rows={4} placeholder={"nume,prenume,email\nPopescu,Ana,ana.popescu@proton.me"} className="w-full rounded-xl border-2 border-mov/20 p-2 font-mono text-xs" />
      </label>
      <Buton pending={pending} disabled={!clase.length}>Importă elevii</Buton>
      {st.conturi && st.conturi.length > 0 && <ConturiNoi conturi={st.conturi} />}
    </FormActiune>
  );
}

export function ButonResetare({ id }: { id: string }) {
  const [st, act, pending] = useActionState(reseteazaParola, {} as StareAdmin);
  if (st.conturi?.[0]) return <span className="rounded-lg bg-galben-deschis px-2 py-1 font-mono text-xs">parolă nouă: <b>{st.conturi[0].parola}</b></span>;
  return (
    <FormActiune actiune={act} confirmare="Resetezi parola acestui cont? Persoana va primi o parolă temporară nouă.">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="rounded-lg px-2 py-1 text-xs font-semibold text-mov hover:bg-mov-deschis">{st.eroare ?? "Resetează parola"}</button>
    </FormActiune>
  );
}

/** Conturile tocmai create, cu parolele temporare: descărcare CSV sau bilețele de printat. */
function ConturiNoi({ conturi }: { conturi: ContNou[] }) {
  const descarca = () => {
    const csv = scrieCsv([["nume", "prenume", "email", "parola temporara", "clasa"], ...conturi.map((c) => [c.nume, c.prenume, c.email, c.parola, c.clasa ?? ""])]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `conturi-noi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const printeaza = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Bilețele de acces</title><style>body{font-family:sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:8mm;padding:10mm}div{border:2px dashed #6a59a7;border-radius:4mm;padding:5mm}b{color:#6a59a7}</style>${conturi
      .map((c) => `<div><b>Matematică cu Sens</b><p>${esc(c.prenume)} ${esc(c.nume)}</p><p>Email: <b>${esc(c.email)}</b><br>Parola: <b>${esc(c.parola)}</b></p><small>La prima intrare vei alege o parolă nouă.</small></div>`)
      .join("")}<script>print()</script>`);
    w.document.close();
  };
  return (
    <div className="mt-4 rounded-xl border-2 border-galben bg-galben-deschis p-3 text-sm">
      <p className="font-bold">⚠️ Parolele temporare apar doar acum.</p>
      <ul className="mt-2 max-h-40 overflow-auto font-mono text-xs">
        {conturi.map((c) => <li key={c.email}>{c.email} → <b>{c.parola}</b></li>)}
      </ul>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={descarca} className="rounded-lg bg-mov px-3 py-1.5 font-semibold text-white">⬇️ CSV</button>
        <button type="button" onClick={printeaza} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-mov ring-1 ring-mov">🖨️ Bilețele</button>
      </div>
    </div>
  );
}
