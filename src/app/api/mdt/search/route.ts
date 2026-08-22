import { NextRequest, NextResponse } from 'next/server';
import {
  currentMDTUser,
  mdtPersonsCollection,
  mdtVehiclesCollection,
  mdtCasesCollection,
  mdtWarrantsCollection,
  mdtBolosCollection,
  mdtOfficersCollection,
} from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

const RESULTS_PER_CATEGORY = 6;

export async function GET(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ success: true, results: { persons: [], vehicles: [], cases: [], warrants: [], bolos: [], officers: [] } });

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  try {
    const [personsCol, vehiclesCol, casesCol, warrantsCol, bolosCol, officersCol] = await Promise.all([
      mdtPersonsCollection(), mdtVehiclesCollection(), mdtCasesCollection(), mdtWarrantsCollection(), mdtBolosCollection(), mdtOfficersCollection(),
    ]);

    const [personDocs, vehicleDocs, caseDocs, warrantDocs, boloDocs, officerDocs] = await Promise.all([
      personsCol.find({ $or: [{ firstName: rx }, { lastName: rx }, { address: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      vehiclesCol.find({ $or: [{ plate: rx }, { make: rx }, { model: rx }, { registeredOwner: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      casesCol.find({ $or: [{ caseNumber: rx }, { title: rx }, { summary: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      warrantsCol.find({ $or: [{ personName: rx }, { warrantNumber: rx } ] }).limit(RESULTS_PER_CATEGORY).toArray(),
      bolosCol.find({ $or: [{ title: rx }, { subject: rx }, { boloNumber: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      officersCol.find({ $or: [{ firstName: rx }, { lastName: rx }, { badgeNumber: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        persons: personDocs.map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, riskLevel: p.riskLevel, address: p.address })),
        vehicles: vehicleDocs.map((v: any) => ({ id: v.id, plate: v.plate, make: v.make, model: v.model, isStolen: v.isStolen, registeredOwner: v.registeredOwner })),
        cases: caseDocs.map((c: any) => ({ id: c.id, caseNumber: c.caseNumber, title: c.title, status: c.status, priority: c.priority })),
        warrants: warrantDocs.map((w: any) => ({ id: w.id, warrantNumber: w.warrantNumber, personName: w.personName, isActive: w.isActive })),
        bolos: boloDocs.map((b: any) => ({ id: b.id, boloNumber: b.boloNumber, title: b.title, status: b.status, priority: b.priority })),
        officers: officerDocs.map((o: any) => ({ id: o.id, badgeNumber: o.badgeNumber, firstName: o.firstName, lastName: o.lastName, rank: o.rank, onDuty: o.onDuty })),
      },
    });
  } catch (error) {
    console.error('Error en búsqueda global de la MDT:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
