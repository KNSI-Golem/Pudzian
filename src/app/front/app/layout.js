import { geistMono, geistSans } from "./fonts";
import "./globals.css";

export const metadata = {
  title: "GolemVR",
  description: "Feel the power of the Golem",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
