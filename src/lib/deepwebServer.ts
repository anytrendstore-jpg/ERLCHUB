import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

export interface DeepWebItem {
  id: string;
  name: string;
  description: string;
  category: 'Herramientas' | 'Tecnología' | 'Documentos' | 'Disfraces' | 'Defensa' | 'Software' | 'Falsificación';
  price: number;
  risk: 'low' | 'medium' | 'high';
  vendor: string;
  escrow: boolean;
  stock: number;
  createdAt: Date;
}

export interface PlayerDeepWebItem {
  id: string;
  ownerId: string;
  itemId: string;
  name: string;
  category: string;
  giftedBy?: string;
  purchasedAt: Date;
}

export async function currentDeepWebUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function deepWebItemsCollection(): Promise<Collection<DeepWebItem>> {
  const db = await connectToDatabase();
  const col = db.collection<DeepWebItem>('deepweb_items');
  await col.createIndex({ category: 1 }).catch(() => {});
  await col.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function playerDeepWebItemsCollection(): Promise<Collection<PlayerDeepWebItem>> {
  const db = await connectToDatabase();
  const col = db.collection<PlayerDeepWebItem>('player_deepweb_items');
  await col.createIndex({ ownerId: 1 }).catch(() => {});
  return col;
}

const SEED: Array<Omit<DeepWebItem, 'id' | 'createdAt'>> = [
  { name: 'Lockpick Set Profesional', description: 'Kit completo de ganzúas para cerraduras de alta seguridad. Incluye 24 piezas y estuche.', category: 'Herramientas', price: 35000, risk: 'medium', vendor: 'ShadowVendor', escrow: true, stock: 15 },
  { name: 'Radio Scanner Policial', description: 'Escáner de frecuencias de radio policial. Intercepta comunicaciones en tiempo real.', category: 'Tecnología', price: 85000, risk: 'high', vendor: 'TechGhost', escrow: true, stock: 8 },
  { name: 'Documentos Falsos Premium', description: 'Pack de documentos alternativos de alta calidad. Incluye ID, licencia y más.', category: 'Documentos', price: 120000, risk: 'high', vendor: 'PaperMaster', escrow: true, stock: 50 },
  { name: 'Kit de Disfraz Completo', description: 'Disfraz profesional con peluca, maquillaje prostético y accesorios.', category: 'Disfraces', price: 28000, risk: 'low', vendor: 'Chameleon', escrow: true, stock: 30 },
  { name: 'Inhibidor de Señal GPS', description: 'Bloqueador de señales GPS y celulares. Rango de 50 metros.', category: 'Tecnología', price: 65000, risk: 'high', vendor: 'SignalKiller', escrow: true, stock: 12 },
  { name: 'Spray Neutralizador', description: 'Spray de defensa personal de alta potencia. Efecto inmediato.', category: 'Defensa', price: 15000, risk: 'medium', vendor: 'DefenseX', escrow: true, stock: 100 },
  { name: 'Software de Hackeo Básico', description: 'Suite de herramientas para penetración de sistemas. Incluye tutoriales.', category: 'Software', price: 45000, risk: 'high', vendor: 'CodePhantom', escrow: false, stock: 999 },
  { name: 'Maletín de Efectivo Falso', description: 'Billetes de práctica para entrenamientos de detección. Solo para uso de roleplay.', category: 'Falsificación', price: 55000, risk: 'high', vendor: 'MoneyPrinter', escrow: true, stock: 20 },
];

export async function ensureDeepWebSeeded(): Promise<Collection<DeepWebItem>> {
  const col = await deepWebItemsCollection();
  const count = await col.countDocuments();
  if (count > 0) return col;
  const now = new Date();
  // Upsert por name (índice único): dos requests concurrentes viendo count===0 a la vez no deben
  // poder duplicar el catálogo semilla.
  await Promise.all(SEED.map((i) => col.updateOne(
    { name: i.name },
    { $setOnInsert: { ...i, id: crypto.randomUUID(), createdAt: now } },
    { upsert: true }
  )));
  return col;
}
