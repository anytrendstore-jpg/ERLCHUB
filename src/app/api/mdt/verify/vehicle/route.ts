import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser } from '@/lib/mdtServer';
import { playerVehiclesCollection } from '@/lib/dealerServer';
import { socialProfilesCollection } from '@/lib/socialServer';

export const dynamic = 'force-dynamic';

/** Cruza una placa con el registro real del Concesionario (fuera del dossier manual del MDT). */
export async function GET(request: NextRequest) {
  const officer = await currentMDTUser();
  if (!officer) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const plate = request.nextUrl.searchParams.get('plate')?.trim();
  if (!plate) return NextResponse.json({ success: false, error: 'Falta la placa' }, { status: 400 });

  try {
    const vehiclesCol = await playerVehiclesCollection();
    const vehicle = await vehiclesCol.findOne({ plate: { $regex: `^${plate}$`, $options: 'i' } });
    if (!vehicle) return NextResponse.json({ success: true, found: false });

    const profilesCol = await socialProfilesCollection();
    const owner = await profilesCol.findOne({ discordId: vehicle.ownerId });

    return NextResponse.json({
      success: true,
      found: true,
      vehicle: {
        name: vehicle.name,
        brand: vehicle.brand,
        plate: vehicle.plate,
        color: vehicle.color,
        financed: vehicle.financed,
        purchasedAt: vehicle.purchasedAt,
        ownerName: owner?.displayName || owner?.username || 'Desconocido',
      },
    });
  } catch (error) {
    console.error('Error verificando vehículo:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
