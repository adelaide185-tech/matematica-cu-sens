import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESIUNE, verifica } from "@/lib/sesiune-token";

/** Cu bază de date configurată, zonele aplicației cer autentificare. Fără ea: mod demonstrativ. */
function dbConfigurata(): boolean {
  return Boolean(
    process.env.DATABASE_URL || process.env.POSTGRES_URL || Object.keys(process.env).some((k) => /_(DATABASE_URL|POSTGRES_URL)$/.test(k)),
  );
}

const REGULI: { prefix: string; roluri: string[] }[] = [
  { prefix: "/admin", roluri: ["ADMIN_SCOALA"] },
  { prefix: "/profesor", roluri: ["PROFESOR", "ADMIN_SCOALA"] },
  { prefix: "/fisa", roluri: ["PROFESOR", "ADMIN_SCOALA"] },
  { prefix: "/elev", roluri: ["ELEV", "PROFESOR", "ADMIN_SCOALA"] },
];

export async function middleware(req: NextRequest) {
  if (!dbConfigurata()) return NextResponse.next();
  const { pathname } = req.nextUrl;
  const regula = REGULI.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!regula) return NextResponse.next();

  // generatorul PDF deschide /fisa din server; îl recunoaștem după tokenul semnat pe care îl trimite
  const s = await verifica(req.cookies.get(COOKIE_SESIUNE)?.value);
  if (!s) {
    const url = new URL("/autentificare", req.url);
    url.searchParams.set("inapoi", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (s.schimbaParola && pathname !== "/schimba-parola") return NextResponse.redirect(new URL("/schimba-parola", req.url));
  if (!regula.roluri.includes(s.rol)) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/profesor/:path*", "/fisa/:path*", "/elev/:path*"] };
