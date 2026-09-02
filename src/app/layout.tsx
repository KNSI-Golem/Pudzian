import type { Metadata } from "next";
import "./globals.css";
import "@/styles/components.css";
import { Header, Footer } from "@/components/layout";
import { APP_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_CONFIG.fullName} ${APP_CONFIG.name}`,
  description: "Sztuczna inteligencja i rozpoznawanie postawy ciała",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`antialiased min-h-screen flex flex-col`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
