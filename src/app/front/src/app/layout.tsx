import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koło Naukowe AI GOLEM",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <header className="w-full p-4 border-b border-gray-600/50 sticky top-0 z-10 bg-opacity-80 backdrop-blur-sm" style={{backgroundColor: '#3a3a46cc'}}>
          <div className="container mx-auto flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="GOLEM Logo"
              width={50}
              height={50}
              className="rounded"
            />
            <div className="flex flex-col items-start">
              <h1 className="font-golem text-3xl font-bold tracking-widest text-white">GOLEM</h1>
              <p className="font-golem text-xs text-gray-300 -mt-1">KOŁO NAUKOWE SZTUCZNEJ INTELIGENCJI</p>
            </div>
          </div>
        </header>
        
        {children}
        
        <footer className="w-full p-4 mt-8">
          <div className="container mx-auto text-center text-sm text-gray-500">
            <p>&copy; 2024 Koło Naukowe Sztucznej Inteligencji GOLEM. Wszelkie prawa zastrzeżone.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
