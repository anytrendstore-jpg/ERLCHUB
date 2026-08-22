import { playerWeaponsCollection, type PlayerWeapon } from '@/lib/ammoServer';

/** Peso de referencia (kg) por categoría de arma, usado para el límite de capacidad del inventario. */
export const WEAPON_CATEGORY_WEIGHT: Record<string, number> = {
  Pistola: 1.2,
  Rifle: 4.5,
  Escopeta: 3.8,
  Munición: 0.5,
  Accesorio: 0.3,
  Chaleco: 2.5,
};

const DEFAULT_WEAPON_WEIGHT = 1;

export const MAX_WEAPON_CAPACITY_KG = 40;

export function weaponWeight(category: string): number {
  return WEAPON_CATEGORY_WEIGHT[category] ?? DEFAULT_WEAPON_WEIGHT;
}

export function sumWeaponWeight(items: Pick<PlayerWeapon, 'category'>[]): number {
  return items.reduce((total, item) => total + weaponWeight(item.category), 0);
}

/** Peso actualmente cargado por un jugador (armas realmente en su inventario, no dossiers del MDT). */
export async function getWeaponCapacityUsage(discordId: string): Promise<{ used: number; max: number }> {
  const col = await playerWeaponsCollection();
  const items = await col.find({ ownerId: discordId }).toArray();
  return { used: Math.round(sumWeaponWeight(items) * 10) / 10, max: MAX_WEAPON_CAPACITY_KG };
}
