import { NextResponse } from 'next/server';
import { currentAmmoUser, ensureAmmoSeeded, playerLicensesCollection } from '@/lib/ammoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentAmmoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [itemsCol, licensesCol] = await Promise.all([ensureAmmoSeeded(), playerLicensesCollection()]);
    const [items, license] = await Promise.all([
      itemsCol.find({}).toArray(),
      licensesCol.findOne({ discordId: me.id, type: 'weapons' }),
    ]);
    return NextResponse.json({
      success: true,
      items: items.map(({ _id, ...i }: any) => i),
      hasLicense: Boolean(license),
    });
  } catch (error) {
    console.error('Error listando catálogo de Ammu-Nation:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
