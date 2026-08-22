import { NextResponse } from 'next/server';
import { currentAmmoUser, playerWeaponsCollection } from '@/lib/ammoServer';
import { sumWeaponWeight, MAX_WEAPON_CAPACITY_KG } from '@/lib/inventoryCapacity';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentAmmoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await playerWeaponsCollection();
    const docs = await col.find({ ownerId: me.id }).sort({ purchasedAt: -1 }).toArray();
    const used = Math.round(sumWeaponWeight(docs) * 10) / 10;
    return NextResponse.json({
      success: true,
      items: docs.map(({ _id, ...i }: any) => i),
      capacity: { used, max: MAX_WEAPON_CAPACITY_KG },
    });
  } catch (error) {
    console.error('Error listando mis armas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
