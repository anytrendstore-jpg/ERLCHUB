export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  official: boolean;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  iconId: string;
  /** Fotos subidas por el vendedor (data URLs comprimidas en el navegador). La primera es la portada. */
  images: string[];
  category: string;
  stock: number;
  status: 'active' | 'paused' | 'removed';
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceFavorite {
  discordId: string;
  listingId: string;
  createdAt: Date;
}

export interface MarketplaceReview {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  buyerUsername: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface MarketplaceQuestion {
  id: string;
  listingId: string;
  sellerId: string;
  askerId: string;
  askerUsername: string;
  question: string;
  answer?: string;
  answeredAt?: Date;
  createdAt: Date;
}

export interface MarketplacePurchase {
  id: string;
  listingId: string;
  listingName: string;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  sellerUsername: string;
  price: number;
  quantity: number;
  total: number;
  commission: number;
  sellerPayout: number;
  giftedBy?: string;
  giftedByUsername?: string;
  createdAt: Date;
}
