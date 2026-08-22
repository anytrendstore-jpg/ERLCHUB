/**
 * Datos del mapa 2D interactivo del MDT.
 *
 * El mapa base es la imagen real "Emergency Response Liberty County"
 * (public/maps/erlc-map.png, 1333x1180), provista por el equipo. Este archivo
 * solo guarda coordenadas aproximadas (calibradas visualmente sobre esa
 * imagen) de calles y puntos de interés para el buscador y los marcadores
 * interactivos — las calles en sí ya están dibujadas dentro de la imagen.
 */

export type POIType = "hospital" | "police" | "fire" | "gas" | "bank" | "park" | "shop";

export interface MapPOI {
  id: string;
  name: string;
  type: POIType;
  x: number;
  y: number;
  districtId: string;
}

/** Nombre + punto de referencia (para el buscador / "ir a"), no se dibujan como líneas: ya están en la imagen. */
export interface MapStreet {
  id: string;
  name: string;
  type: "highway" | "avenue" | "street";
  districtId: string;
  points: string;
}

/** Zonas amplias usadas solo para agrupar resultados de búsqueda (sin dibujo de polígono). */
export interface MapDistrict {
  id: string;
  name: string;
  postalCode: string;
  color: string;
  points: string;
  streets: string[];
}

export const DISTRICTS: MapDistrict[] = [
  { id: "north-cluster", name: "Zona Norte (Springs / Maple / Oak Valley)", postalCode: "—", color: "#3a4a63", points: "", streets: ["Highway 55 North", "Highway 55 South", "Spring Creek Rd", "Northern Way", "Lakeview Ct", "Iron Rd", "Maple St", "Cedar St", "Oak Valley Dr", "Terrace Dr", "Grant St"] },
  { id: "northwest", name: "Noroeste (Pineview / Franklin)", postalCode: "—", color: "#3a4a63", points: "", streets: ["Pineview Dr", "Franklin Ct", "Emerson Rd", "Joyner Rd", "Academy Ln"] },
  { id: "west", name: "Oeste (Valley / Fairfax)", postalCode: "—", color: "#3a4a63", points: "", streets: ["Valley Dr", "Arbor Ln", "Fairfax Rd", "Medical Way"] },
  { id: "central", name: "Centro (Colonial / Vine / Gibson)", postalCode: "—", color: "#4a3a5c", points: "", streets: ["Colonial Dr", "Vine St", "Lee St", "Gibson Ln", "Riverside Dr"] },
  { id: "downtown", name: "Downtown (Independence / Main)", postalCode: "—", color: "#4a3a5c", points: "", streets: ["Independence Pkwy", "Hillview Rd", "Sandstone Rd", "Main St", "Park St", "Orchard Bvld", "Grand Ave", "Durham Rd"] },
  { id: "industrial", name: "Industrial (Georgia / Cross)", postalCode: "—", color: "#5c4a2f", points: "", streets: ["Industrial Rd", "Georgia Ave", "Cross St", "Cline St"] },
  { id: "south", name: "Sur (Freedom / Madison / Liberty)", postalCode: "—", color: "#3a4a63", points: "", streets: ["Freedom Ave", "Madison Ct", "Southern Avenue", "Liberty Way"] },
];

export const STREETS: MapStreet[] = [
  { id: "hwy55-n", name: "Highway 55 North", type: "highway", districtId: "north-cluster", points: "722,40" },
  { id: "hwy55-s", name: "Highway 55 South", type: "highway", districtId: "north-cluster", points: "722,56" },
  { id: "riverside-dr", name: "Riverside Dr", type: "avenue", districtId: "central", points: "514,482" },
  { id: "spring-creek-rd", name: "Spring Creek Rd", type: "street", districtId: "north-cluster", points: "634,152" },
  { id: "northern-way", name: "Northern Way", type: "street", districtId: "north-cluster", points: "658,88" },
  { id: "lakeview-ct", name: "Lakeview Ct", type: "street", districtId: "north-cluster", points: "827,225" },
  { id: "iron-rd", name: "Iron Rd", type: "street", districtId: "north-cluster", points: "835,257" },
  { id: "maple-st-w", name: "Maple St", type: "street", districtId: "north-cluster", points: "867,350" },
  { id: "maple-st-e", name: "Maple St", type: "street", districtId: "north-cluster", points: "1140,350" },
  { id: "cedar-st", name: "Cedar St", type: "street", districtId: "north-cluster", points: "1059,321" },
  { id: "oak-valley-dr", name: "Oak Valley Dr", type: "street", districtId: "north-cluster", points: "1148,353" },
  { id: "terrace-dr", name: "Terrace Dr", type: "street", districtId: "north-cluster", points: "1212,257" },
  { id: "grant-st", name: "Grant St", type: "street", districtId: "north-cluster", points: "1075,465" },
  { id: "pineview-dr", name: "Pineview Dr", type: "street", districtId: "northwest", points: "289,334" },
  { id: "franklin-ct", name: "Franklin Ct", type: "street", districtId: "northwest", points: "257,457" },
  { id: "emerson-rd", name: "Emerson Rd", type: "street", districtId: "northwest", points: "257,465" },
  { id: "joyner-rd", name: "Joyner Rd", type: "street", districtId: "northwest", points: "345,465" },
  { id: "academy-ln", name: "Academy Ln", type: "street", districtId: "northwest", points: "80,457" },
  { id: "colonial-dr", name: "Colonial Dr", type: "avenue", districtId: "central", points: "706,457" },
  { id: "valley-dr", name: "Valley Dr", type: "street", districtId: "west", points: "160,618" },
  { id: "arbor-ln", name: "Arbor Ln", type: "street", districtId: "west", points: "265,674" },
  { id: "fairfax-rd", name: "Fairfax Rd", type: "street", districtId: "west", points: "193,730" },
  { id: "medical-way", name: "Medical Way", type: "street", districtId: "west", points: "393,722" },
  { id: "vine-st", name: "Vine St", type: "street", districtId: "central", points: "754,623" },
  { id: "lee-st", name: "Lee St", type: "street", districtId: "central", points: "742,650" },
  { id: "gibson-ln", name: "Gibson Ln", type: "street", districtId: "central", points: "738,682" },
  { id: "independence-pkwy", name: "Independence Pkwy", type: "avenue", districtId: "downtown", points: "482,811" },
  { id: "hillview-rd", name: "Hillview Rd", type: "street", districtId: "downtown", points: "152,907" },
  { id: "sandstone-rd", name: "Sandstone Rd", type: "street", districtId: "downtown", points: "32,1019" },
  { id: "main-st", name: "Main St", type: "street", districtId: "downtown", points: "329,955" },
  { id: "park-st", name: "Park St", type: "street", districtId: "downtown", points: "414,867" },
  { id: "orchard-bvld", name: "Orchard Bvld", type: "avenue", districtId: "downtown", points: "482,902" },
  { id: "grand-ave", name: "Grand Ave", type: "street", districtId: "downtown", points: "241,955" },
  { id: "durham-rd", name: "Durham Rd", type: "street", districtId: "downtown", points: "297,955" },
  { id: "industrial-rd", name: "Industrial Rd", type: "street", districtId: "industrial", points: "626,955" },
  { id: "georgia-ave", name: "Georgia Ave", type: "street", districtId: "industrial", points: "706,963" },
  { id: "cross-st", name: "Cross St", type: "street", districtId: "industrial", points: "674,955" },
  { id: "cline-st", name: "Cline St", type: "street", districtId: "industrial", points: "770,955" },
  { id: "freedom-ave", name: "Freedom Ave", type: "avenue", districtId: "south", points: "482,1024" },
  { id: "madison-ct", name: "Madison Ct", type: "street", districtId: "south", points: "674,1051" },
  { id: "southern-avenue", name: "Southern Avenue", type: "street", districtId: "south", points: "249,1091" },
  { id: "liberty-way", name: "Liberty Way", type: "street", districtId: "south", points: "265,1140" },
];

export const POIS: MapPOI[] = [
  { id: "poi-pd", name: "Departamento de Policía", type: "police", x: 329, y: 915, districtId: "downtown" },
  { id: "poi-fd", name: "Estación de Bomberos", type: "fire", x: 414, y: 891, districtId: "downtown" },
  { id: "poi-hospital", name: "Hospital Central", type: "hospital", x: 738, y: 738, districtId: "central" },
  { id: "poi-bank", name: "Banco", type: "bank", x: 241, y: 987, districtId: "downtown" },
  { id: "poi-gas1", name: "Gasolinera Riverside", type: "gas", x: 514, y: 546, districtId: "central" },
  { id: "poi-gas2", name: "Gasolinera Oak Valley", type: "gas", x: 1124, y: 401, districtId: "north-cluster" },
  { id: "poi-shop1", name: "Zona Comercial Maple", type: "shop", x: 995, y: 350, districtId: "north-cluster" },
];

export const MAP_VIEWBOX = { width: 1333, height: 1180 };
export const MAP_IMAGE_URL = "/maps/erlc-map.png";
