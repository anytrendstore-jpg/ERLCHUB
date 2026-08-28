import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser, mdtCallsCollection, mdtPersonsCollection, mdtVehiclesCollection } from '@/lib/mdtServer';
import { fdFirefightersCollection, fdCasesCollection, fdEquipmentCollection, fdCertificationsCollection } from '@/lib/fdServer';
import { playerPropertiesCollection } from '@/lib/propertiesServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

const RESULTS_PER_CATEGORY = 6;
const EMPTY = { personnel: [], calls: [], cases: [], equipment: [], certifications: [], persons: [], vehicles: [], properties: [] };

/** Búsqueda global de LSFD — espejo de /api/mdt/search, sobre las colecciones propias de bomberos. */
export async function GET(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 });

  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ success: true, results: EMPTY });

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  try {
    const [personnelCol, callsCol, casesCol, equipmentCol, certsCol, personsCol, vehiclesCol, propertiesCol] = await Promise.all([
      fdFirefightersCollection(), mdtCallsCollection(), fdCasesCollection(), fdEquipmentCollection(), fdCertificationsCollection(), mdtPersonsCollection(), mdtVehiclesCollection(), playerPropertiesCollection(),
    ]);

    const [personnelDocs, callDocs, caseDocs, equipmentDocs, certDocs, personDocs, vehicleDocs, propertyDocs] = await Promise.all([
      personnelCol.find({ $or: [{ firstName: rx }, { lastName: rx }, { badgeNumber: rx }, { callsign: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      callsCol.find({ faction: 'Bomberos', $or: [{ title: rx }, { location: rx }, { type: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      casesCol.find({ $or: [{ caseNumber: rx }, { title: rx }, { location: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      equipmentCol.find({ $or: [{ name: rx }, { assetTag: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      certsCol.find({ $or: [{ name: rx }, { firefighterName: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      // Solo lectura — consulta situacional en escena (¿quién vive acá? ¿de quién es este vehículo/propiedad?), LSFD nunca edita estas colecciones.
      personsCol.find({ $or: [{ firstName: rx }, { lastName: rx }, { address: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      vehiclesCol.find({ $or: [{ plate: rx }, { make: rx }, { model: rx }, { registeredOwner: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
      propertiesCol.find({ $or: [{ name: rx }, { address: rx }, { type: rx }] }).limit(RESULTS_PER_CATEGORY).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        personnel: personnelDocs.map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, badgeNumber: p.badgeNumber, callsign: p.callsign, onDuty: p.onDuty })),
        calls: callDocs.map((c: any) => ({ id: c.id, title: c.title, type: c.type, location: c.location, priority: c.priority, status: c.status })),
        cases: caseDocs.map((c: any) => ({ id: c.id, caseNumber: c.caseNumber, title: c.title, status: c.status })),
        equipment: equipmentDocs.map((e: any) => ({ id: e.id, name: e.name, category: e.category, status: e.status })),
        certifications: certDocs.map((c: any) => ({ id: c.id, name: c.name, firefighterName: c.firefighterName, status: c.status })),
        persons: personDocs.map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, address: p.address, flags: p.flags })),
        vehicles: vehicleDocs.map((v: any) => ({ id: v.id, plate: v.plate, make: v.make, model: v.model, registeredOwner: v.registeredOwner, isStolen: v.isStolen })),
        properties: propertyDocs.map((p: any) => ({ id: p.id, name: p.name, type: p.type, address: p.address })),
      },
    });
  } catch (error) {
    console.error('Error en búsqueda global de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
