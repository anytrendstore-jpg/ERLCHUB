import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { MDTProvider } from "@/contexts/MDTContext";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ERLCᴴᵁᴮ | La mejor comunidad de Roleplay en Latinoamérica",
  description: "ERLCᴴᵁᴮ es la comunidad de Roleplay más grande y activa de Latinoamérica, ofreciendo una experiencia única y envolvente para jugadores de todos los niveles. Únete a nosotros y descubre un mundo de posibilidades en ERLC.",
  icons: {
    icon: "/sistemas/logo.png",
    shortcut: "/sistemas/logo.png",
    apple: "/sistemas/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <MDTProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </MDTProvider>
      </body>
    </html>
  );
}
