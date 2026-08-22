import { NextResponse } from 'next/server';
import { currentArchivosUser } from '@/lib/archivosServer';
import { applications } from '@/lib/whitelistServer';
import { playerLicensesCollection } from '@/lib/ammoServer';

export const dynamic = 'force-dynamic';

/** Documentos reales del personaje: DNI (whitelist) y licencias (Ammu-Nation). Solo lectura. */
export async function GET() {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const [appsCol, licensesCol] = await Promise.all([applications(), playerLicensesCollection()]);
    const [app, licenses] = await Promise.all([
      appsCol.findOne({ discordId: me.id }),
      licensesCol.find({ discordId: me.id }).toArray(),
    ]);

    const documents: any[] = [];

    if (app?.document && app.character) {
      documents.push({
        id: `dni-${app.applicationId}`,
        kind: 'dni',
        name: 'Documento de Identidad',
        holder: `${app.character.firstName} ${app.character.lastName}`,
        number: app.document.number,
        issueDate: app.document.issueDate,
        expiryDate: app.document.expiryDate,
        status: app.status,
        photoUrl: app.character.photoUrl,
        details: {
          Nacionalidad: app.character.nationality,
          Ciudad: app.character.city,
          Nacimiento: app.character.birthDate,
          Género: app.character.gender,
        },
      });
    }

    for (const lic of licenses) {
      documents.push({
        id: `license-${lic.type}-${me.id}`,
        kind: 'license',
        name: lic.type === 'weapons' ? 'Licencia de Portación de Armas' : `Licencia (${lic.type})`,
        holder: me.displayName,
        issueDate: lic.purchasedAt,
        status: 'Vigente',
        details: { Tipo: 'Armas de fuego', 'Emitida por': 'Ammu-Nation' },
      });
    }

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('Error leyendo documentos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
