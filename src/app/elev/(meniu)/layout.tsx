import { BaraCont } from "@/componente/BaraCont";

/** Meniurile zonei elev au bara de cont; ecranele de joc nu (zero aglomerație pe tablă). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaraCont />
      {/* culorile Fabricii de Inteligență (lavandă → cyan) în toate meniurile copiilor */}
      <div className="fundal-fabrica min-h-screen">{children}</div>
    </>
  );
}
