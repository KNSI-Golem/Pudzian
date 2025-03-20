import { Nabla } from 'next/font/google';
import { Geist, Geist_Mono } from "next/font/google";


export const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });
  
export const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

export const nabla = Nabla({ subsets: ['latin'] });