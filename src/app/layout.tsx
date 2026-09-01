import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {Jura} from "next/font/google";
import "./globals.css";
import "@/styles/components.css";
import { Header, Footer } from "@/components/layout";
import { APP_CONFIG } from "@/lib/constants";

const jura = Jura({
  variable: "--font-jura",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${jura.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
