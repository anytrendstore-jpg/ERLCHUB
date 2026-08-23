export interface HubCoinsPackage {
  id: string;
  coins: number;
  bonus: number;
  priceUSD: number;
  popular?: boolean;
}

export interface Membership {
  id: string;
  name: string;
  description: string;
  image: string;
  benefits: string[];
  priceMonthly: number;
  pricePermanent: number;
  color: string;
}


export interface Kit {
  id: string;
  name: string;
  description: string;
  image: string;
  items: string[];
  priceHubCoins: number;
  category: string;
  color: string;
  /** Cupos de personaje que otorga automáticamente esta compra (se suman a la cuenta al pagar). */
  characterSlotsGranted?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  image: string;
  priceHubCoins: number;
  category: string;
  type: "vehicle" | "weapon" | "clothing" | "accessory" | "other";
}

export interface CasinoGame {
  id: string;
  name: string;
  description: string;
  image: string;
  minBet: number;
  maxBet: number;
  type: "roulette" | "mystery_box" | "lottery";
}

export interface UserBalance {
  hubCoins: number;
  pendingCoins: number;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToUSD: number;
}

export interface CartItem {
  id: string;
  type: "hub-coins" | "membership" | "kit" | "item";
  name: string;
  priceUSD?: number;
  priceHubCoins?: number;
  price?: number; 
  quantity: number;
  image?: string;
  paymentType?: "monthly" | "permanent";
  bonus?: number;
  coins?: number;
  category?: string;
  details?: string; 
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}