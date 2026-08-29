import type { HubCoinsPackage, Membership, Kit, ShopItem, CasinoGame, CurrencyRate } from "./types";

export const hubCoinsPackages: HubCoinsPackage[] = [
  { id: "hc-500", coins: 500, bonus: 0, priceUSD: 5 },
  { id: "hc-1000", coins: 1000, bonus: 150, priceUSD: 10 },
  { id: "hc-2000", coins: 2000, bonus: 350, priceUSD: 20, popular: true },
  { id: "hc-4000", coins: 4000, bonus: 900, priceUSD: 40 },
  { id: "hc-6000", coins: 6000, bonus: 1650, priceUSD: 60 },
  { id: "hc-8000", coins: 8000, bonus: 2600, priceUSD: 80 },
  { id: "hc-10000", coins: 10000, bonus: 3750, priceUSD: 100 },
];

export const memberships: Membership[] = [
  {
    id: "mem-vip",
    name: "VIP",
    description: "¡Conviértete en una leyenda de nuestro servidor! El Rango VIP Permanente está diseñado para los jugadores que no se conforman con lo básico y buscan dominar el entorno con beneficios exclusivos y un estatus inigualable.",
    image: "/tienda-membresias/vip.png",
    benefits: [
      "Acceso prioritario en tickets",
      "Rango exclusivo en Discord (VIP)",
      "Rol especial en SocialHub (VIP)",
      "$50,000 dinero inicial",
      "$10,000 cada 3 días",
      "2 vehículos regulares",
      "1 propiedad básica",
      "2 personajes (2 PJs)"
    ],
    priceMonthly: 14.99,
    pricePermanent: 75,
    color: "#3b82f6",
    characterSlots: 2
  },
  {
    id: "mem-elite",
    name: "ELITE",
    description: "Este no es un rango para cualquiera. Es el paquete definitivo diseñado exclusivamente para los jugadores más dedicados que buscan el control total y el estatus máximo. Domina el servidor con recursos de élite y privilegios que nadie más posee.",
    image: "/tienda-membresias/elite.png",
    benefits: [
      "Acceso prioritario en tickets (más rápido que VIP)",
      "Rango exclusivo en Discord (Elite)",
      "Rol especial en SocialHub (Elite)",
      "$120,000 dinero inicial",
      "$25,000 cada 3 días",
      "3 vehículos (2 deportivos + 1 regular)",
      "2 propiedades (1 media + 1 básica)",
      "3 personajes (3 PJs)",
      "1 Desert Eagle",
      "1 TEC-9"
    ],
    priceMonthly: 24.99,
    pricePermanent: 125,
    color: "#a855f7",
    characterSlots: 3
  },
  {
    id: "mem-legend",
    name: "LEYENDA",
    description: "Este no es solo un rango, es el estatus máximo alcanzable. Reservado únicamente para aquellos que desean escribir la historia del servidor. Como Leyenda, el mundo está a tus pies con recursos ilimitados, armamento pesado y el respeto total de la comunidad.",
    image: "/tienda-membresias/leyenda.png",
    benefits: [
      "Máxima prioridad en tickets",
      "Rango exclusivo en Discord (Leyenda)",
      "Rol especial en SocialHub (Leyenda)",
      "$300,000 dinero inicial",
      "$60,000 cada 3 días",
      "5 vehículos (2 deportivos + 2 lujosos + 1 regular)",
      "3 propiedades (2 premium + 1 media)",
      "4 personajes (4 PJs)",
      "1 AK-47",
      "1 Desert Eagle",
      "1 TEC-9",
      "1 Francotirador",
      "Permiso para usar francotirador"
    ],
    priceMonthly: 49.99,
    pricePermanent: 200,
    color: "#fbbf24",
    characterSlots: 4
  }
];

export const kits: Kit[] = [
  {
    id: "kit-dinero",
    name: "KIT DINERO",
    description: "Impulsa tu economía desde el inicio y comienza tu experiencia en el servidor con fondos para invertir, comprar propiedades y avanzar sin desbalancear la economía.",
    image: "/tienda-membresias/kit-dinero.png",
    items: ["$50,000 en tu cuenta bancaria del servidor."],
    priceHubCoins: 1000,
    category: "basico",
    color: "#22c55e"
  },
  {
    id: "kit-armas",
    name: "KIT ARMAS",
    description: "Accede a un kit inicial de armas desbloqueadas para equipar tu inventario, listo para roleplay, sin romper la economía.",
    image: "/tienda-membresias/kit-armas.png",
    items: ["Desbloquea 1 AK-47", "Desbloquea 1 TEC-9", "Desbloquea 1 Beretta M9", "Desbloquea 1 Chaleco Antibalas"],
    priceHubCoins: 2000,
    category: "armas",
    color: "#ef4444"
  },
  {
    id: "kit-autos",
    name: "KIT AUTOS",
    description: "Desplázate por el servidor con estilo y rapidez. Este kit incluye vehículos básicos y deportivos listos para usar.",
    image: "/tienda-membresias/kit-autos.png",
    items: ["Vehículo económico para transporte diario. ( Su elección )", "Vehículo deportivo básico para misiones y roleplay especial. ( Su elección )", "Licencia de conducción y papeles del vehículo en regla."],
    priceHubCoins: 1500,
    category: "vehiculos",
    color: "#fbbf24"
  },
  {
    id: "kit-personajes",
    name: "KIT PERSONAJES",
    description: "Cansado de tu personaje? Con este KIT podrás tener acceso a 1 personaje nuevo adicional, este KIT es acumulable.",
    image: "/tienda-membresias/kit-personajes.png",
    items: ["Desbloquea el acceso a tener su personaje inicial y 1 personaje completamente nuevo ya sea en cualquier ciudad "],
    priceHubCoins: 2000,
    category: "personajes",
    color: "#60a5fa",
    characterSlotsGranted: 1
  },
  {
    id: "kit-full",
    name: "KIT FULL",
    description: "La experiencia completa para empezar en el servidor con todo lo necesario: dinero, vehículos y personaje listo para roleplay.",
    image: "/tienda-membresias/kit-completo.png",
    items: ["$50,000 en efectivo + $20,000 en cuenta bancaria.", "Vehículo económico + deportivo.", "Acceso a 2 Personajes.", "2-AK-47 y 5 TEC-9."],
    priceHubCoins: 2500,
    category: "premium",
    color: "#8b5cf6",
    characterSlotsGranted: 1
  },
  {
    id: "kit-facciones-ilegales",
    name: "KIT FACCIONES ILEGALES",
    description: "Accede a los recursos necesarios para participar en roleplay de facciones ilegales, sin desbalancear la economía ni dar ventajas injustas.",
    image: "/tienda-membresias/kit-facciones-ileagales.png",
    items: ["Acceso a 15k en Efectivo.", "Acceso a usar cualquier tipo de francotirador. ( 1 Jugador )", "Acceso a 5 Chalecos Antibalas.", "Acceso a 3 AK-47.", "Acceso a 5 TEC-9", "Acceso a un Territorio y Propiedad de su eleccion.", "Acceso a 1 Vehiculo para transportarse.", "Acceso a 1 Vehiculo de transporte de mercancia."],
    priceHubCoins: 5000,
    category: "criminal",
    color: "#000000"
  },
  {
    id: "kit-acceso-dept",
    name: "KIT ACCESO DEPT",
    description: "Kit pensado para jugadores que desean integrarse en departamentos, con recursos balanceados y sin accesos especiales.",
    image: "/tienda-membresias/kit-dept.png",
    items: ["Acceso a unirse a cualquier departamento basico que el jugador escoja."],
    priceHubCoins: 2000,
    category: "oficial",
    color: "#3b82f6"
  },
  {
    id: "kit-acceso-staff",
    name: "KIT ACCESO STAFF",
    description: "Recibe un kit de inicio para staff con herramientas de supervisión básicas, sin afectar la economía ni dar poderes injustos.",
    image: "/tienda-membresias/kit-union-staff.png",
    items: ["Acceso a entrar al staff con el rango de SOPORTE sin realizar pruebas"],
    priceHubCoins: 4000,
    category: "staff",
    color: "#1e40af"
  }
];

export const whitelistFastKit = {
  id: "whitelist-fast",
  name: "WHITELIST FAST",
  description: "Whitelist Fast es un servicio exclusivo que permite ingresar al servidor de forma inmediata, sin entrevistas, formularios extensos ni tiempos de espera.",
  image: "/tienda-membresias/whitelist-fast.png",
  items: ["Acceso inmediato al servidor.", "Sin entrevistas ni pruebas previas.", "Activación directa de la whitelist.", "Ideal para jugadores que desean empezar a rolear al instante.", "Ahorro total de tiempo."],
  priceDollars: 7,
  category: "whitelist",
  color: "#8b5cf6"
};

export const shopItems: ShopItem[] = [
  {
    id: "item-supercar",
    name: "Lamborghini Aventador",
    description: "El superdeportivo más deseado del servidor. Velocidad máxima y estilo incomparable.",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80",
    priceHubCoins: 3500,
    category: "vehiculos",
    type: "vehicle"
  },
  {
    id: "item-helicopter",
    name: "Helicóptero Civil",
    description: "Domina los cielos con tu propio helicóptero. Viaja rápido y con estilo.",
    image: "https://images.unsplash.com/photo-1534786047041-d5c9b12bb8bd?w=600&q=80",
    priceHubCoins: 5000,
    category: "vehiculos",
    type: "vehicle"
  },
  {
    id: "item-ak47",
    name: "AK-47 Dorada",
    description: "Edición limitada con acabado en oro. Poder y prestigio en tus manos.",
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&q=80",
    priceHubCoins: 2500,
    category: "armas",
    type: "weapon"
  },
  {
    id: "item-suit",
    name: "Traje Ejecutivo",
    description: "Impresiona con el traje más elegante del servidor. Perfecto para negocios.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    priceHubCoins: 800,
    category: "ropa",
    type: "clothing"
  },
  {
    id: "item-mansion",
    name: "Propiedad: Mansión",
    description: "Tu propia mansión en las colinas. La residencia más lujosa disponible.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    priceHubCoins: 10000,
    category: "propiedades",
    type: "other"
  },
  {
    id: "item-motorcycle",
    name: "Ducati Panigale",
    description: "La motocicleta más rápida disponible. Adrenalina pura en dos ruedas.",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80",
    priceHubCoins: 2000,
    category: "vehiculos",
    type: "vehicle"
  }
];

export const casinoGames: CasinoGame[] = [
  {
    id: "casino-roulette",
    name: "Ruleta de la Fortuna",
    description: "Gira la ruleta y gana premios increíbles. Desde kits hasta vehículos exclusivos.",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600&q=80",
    minBet: 100,
    maxBet: 5000,
    type: "roulette"
  },
  {
    id: "casino-mystery",
    name: "Caja Misteriosa",
    description: "Abre cajas con recompensas aleatorias. ¡Podrías ganar el premio mayor!",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    minBet: 250,
    maxBet: 2500,
    type: "mystery_box"
  },
  {
    id: "casino-lottery",
    name: "Sorteo Semanal",
    description: "Compra boletos para el sorteo semanal con premios épicos.",
    image: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&q=80",
    minBet: 50,
    maxBet: 500,
    type: "lottery"
  }
];

export const currencies: CurrencyRate[] = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$", flag: "🇺🇸", rateToUSD: 1 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", rateToUSD: 0.92 },
  { code: "MXN", name: "Peso mexicano", symbol: "$", flag: "🇲🇽", rateToUSD: 17.15 },
  { code: "COP", name: "Peso colombiano", symbol: "$", flag: "🇨🇴", rateToUSD: 3950 },
  { code: "ARS", name: "Peso argentino", symbol: "$", flag: "🇦🇷", rateToUSD: 875 },
  { code: "PEN", name: "Sol peruano", symbol: "S/", flag: "🇵🇪", rateToUSD: 3.72 },
  { code: "CLP", name: "Peso chileno", symbol: "$", flag: "🇨🇱", rateToUSD: 940 },
];

export const convertPrice = (usd: number, currency: CurrencyRate): string => {
  const converted = usd * currency.rateToUSD;
  if (currency.rateToUSD >= 100) {
    return `${currency.symbol}${Math.round(converted).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
  return `${currency.symbol}${converted.toFixed(2)}`;
};

export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Ahorro real de KIT FULL comparado con comprar dinero + autos + personajes por separado
 * (los 3 componentes que sí calzan uno a uno con lo que ya trae el bundle) — no es un
 * número inventado. Reusado tanto en el listado de la tienda como en el detalle del kit.
 */
export function kitFullBundleSavings(): { amount: number; pct: number } | null {
  const kitFull = kits.find((k) => k.id === "kit-full");
  if (!kitFull) return null;
  const bundleParts = ["kit-dinero", "kit-autos", "kit-personajes"]
    .map((id) => kits.find((k) => k.id === id)?.priceHubCoins || 0)
    .reduce((a, b) => a + b, 0);
  if (bundleParts <= 0) return null;
  const amount = bundleParts - kitFull.priceHubCoins;
  return { amount, pct: Math.round((amount / bundleParts) * 100) };
}