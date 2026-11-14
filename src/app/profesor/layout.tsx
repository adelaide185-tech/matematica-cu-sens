import { BaraCont } from "@/componente/BaraCont";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BaraCont />
      {children}
    </>
  );
}
