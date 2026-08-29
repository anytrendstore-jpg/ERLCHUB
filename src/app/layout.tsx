import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { MDTProvider } from "@/contexts/MDTContext";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/** Fuente cursiva para la firma del DNI (documentos/DocumentCard2D.tsx) — nunca se usa como fuente general del sitio. */
const dancingScript = Dancing_Script({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: ["600", "700"],
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
      <head>
        {/* Se aplica el tema guardado ANTES del primer paint — si esto se hiciera
            en un efecto de React, se vería un parpadeo del tema oscuro por defecto
            justo antes de cambiar al claro guardado. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('erlchub-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${dancingScript.variable} font-sans antialiased`}>
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
