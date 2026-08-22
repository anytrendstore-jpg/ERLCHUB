import { NextRequest, NextResponse } from 'next/server';
import { currentArchivosUser, archivosFoldersCollection, archivosFolderMembersCollection, type ArchivoItemType } from '@/lib/archivosServer';

export const dynamic = 'force-dynamic';

/** Lista todas las asignaciones objeto→carpeta del jugador (para saber en qué carpetas está cada objeto). */
export async function GET() {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const membersCol = await archivosFolderMembersCollection();
    const docs = await membersCol.find({ discordId: me.id }).toArray();
    return NextResponse.json({ success: true, members: docs.map(({ _id, ...m }: any) => m) });
  } catch (error) {
    console.error('Error listando miembros de carpetas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Añade un objeto a una carpeta personal (el objeto sigue existiendo también en su carpeta real de origen). */
export async function POST(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { folderId, itemType, itemId } = await request.json() as { folderId: string; itemType: ArchivoItemType; itemId: string };
    if (!folderId || !itemType || !itemId) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const foldersCol = await archivosFoldersCollection();
    const folder = await foldersCol.findOne({ id: folderId, discordId: me.id });
    if (!folder) return NextResponse.json({ success: false, error: 'Carpeta no encontrada' }, { status: 404 });

    const membersCol = await archivosFolderMembersCollection();
    await membersCol.updateOne(
      { folderId, itemType, itemId },
      { $set: { folderId, discordId: me.id, itemType, itemId, addedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error añadiendo objeto a carpeta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo añadir' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { folderId, itemType, itemId } = await request.json() as { folderId: string; itemType: ArchivoItemType; itemId: string };
    const membersCol = await archivosFolderMembersCollection();
    await membersCol.deleteOne({ folderId, discordId: me.id, itemType, itemId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error quitando objeto de carpeta:', error);
    return NextResponse.json({ success: false, error: 'No se pudo quitar' }, { status: 500 });
  }
}
