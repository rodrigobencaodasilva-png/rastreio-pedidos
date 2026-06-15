import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Rastreio de Pedidos",
  description: "Acompanhe seu pedido em tempo real.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR"><body>{children}</body></html>
  );
}
