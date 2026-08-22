import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser } from '@/lib/mdtServer';
import { applications } from '@/lib/whitelistServer';
import { playerLicensesCollection } from '@/lib/ammoServer';

export const dynamic = 'force-dynamic';

/** Cruza un nombre de persona con el DNI real (whitelist) y su licencia de armas (Ammu-Nation). */
export async function GET(request: NextRequest) {
  const officer = await currentMDTUser();
  if (!officer) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const firstName = request.nextUrl.searchParams.get('firstName')?.trim();
  const lastName = request.nextUrl.searchParams.get('lastName')?.trim();
  if (!firstName || !lastName) return NextResponse.json({ success: false, error: 'Falta el nombre' }, { status: 400 });

  try {
    const appsCol = await applications();
    const app = await appsCol.findOne({
      'character.firstName': { $regex: `^${firstName}$`, $options: 'i' },
      'character.lastName': { $regex: `^${lastName}$`, $options: 'i' },
    });
    if (!app?.character || !app.document) return NextResponse.json({ success: true, found: false });

    const licensesCol = await playerLicensesCollection();
    const license = await licensesCol.findOne({ discordId: app.discordId, type: 'weapons' });

    return NextResponse.json({
      success: true,
      found: true,
      person: {
        documentNumber: app.document.number,
        hasWeaponLicense: Boolean(license),
        weaponLicenseIssuedAt: license?.purchasedAt || null,
      },
    });
  } catch (error) {
    console.error('Error verificando licencia:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
