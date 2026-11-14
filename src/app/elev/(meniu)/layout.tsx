import { BaraCont } from "@/componente/BaraCont";

/** Meniurile zonei elev au bara de cont; ecranele de joc nu (zero aglomerație pe tablă). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaraCont />
      {children}
    </>
  );
}
