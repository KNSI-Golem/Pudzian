import type { Metadata } from "next";
import { geistMono, geistSans } from "./ui/fonts";
import "./ui/globals.css";
import Navigation from "./components/navigation";


export const metadata: Metadata = {
  title: "GolemVR",
  description: "Feel the power of the Golem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation/>
        {children}
      </body>
    </html>
  );
}
