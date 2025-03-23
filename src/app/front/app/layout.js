import Navigation from "./components/navbar";
import Footer from "./components/footer";
import { geistMono, geistSans } from "./fonts";
import './globals.css';

export const metadata = {
  title: "GolemVR",
  description: "Feel the power of the Golem",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
