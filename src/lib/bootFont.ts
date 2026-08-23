import { Chakra_Petch } from "next/font/google";

/**
 * Tipografía de las pantallas de arranque del OS (selección de personaje,
 * selección de ordenador) — un solo lugar para no cargar la misma fuente
 * dos veces con instancias distintas de next/font.
 */
export const bootFont = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
