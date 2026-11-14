import Image from "next/image";
import Link from "next/link";

export function CardCentrat({ titlu, subtitlu, children }: { titlu: string; subtitlu?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-galben-deschis to-mov-deschis px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lg sm:p-8">
        <Link href="/"><Image src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" width={260} height={88} className="mx-auto h-auto w-[220px]" priority /></Link>
        <h1 className="mt-4 text-center text-2xl font-bold text-mov">{titlu}</h1>
        {subtitlu && <p className="mt-1 text-center text-gray-600">{subtitlu}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function Camp({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input {...p} className="w-full rounded-xl border-2 border-mov/20 px-3 py-2.5 text-base outline-none focus:border-mov" />
    </label>
  );
}

export function Mesaj({ eroare, ok }: { eroare?: string; ok?: string }) {
  if (eroare) return <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{eroare}</p>;
  if (ok) return <p role="status" className="mb-3 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{ok}</p>;
  return null;
}

export function Buton({ children, pending, className = "", ...p }: { pending?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="submit" {...p} disabled={pending || p.disabled}
      className={`w-full rounded-xl bg-mov px-4 py-3 text-lg font-bold text-white hover:bg-mov-inchis disabled:opacity-50 ${className}`}>
      {pending ? "Se încarcă…" : children}
    </button>
  );
}
