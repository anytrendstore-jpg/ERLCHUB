import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentArchivosUser, archivosFoldersCollection, archivosFolderMembersCollection } from '@/lib/archivosServer';

export const dynamic = 'force-dynamic';

/** Carpetas personales del jugador (organización libre, no reemplazan las carpetas reales de Compras/Armas/etc). */
export async function GET() {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const foldersCol = await archivosFoldersCollection();
    const membersCol = await archivosFolderMembersCollection();
    const folders = await foldersCol.find({ discordId: me.id }).sort({ createdAt: 1 }).toArray();

    const withCounts = await Promise.all(folders.map(async (f) => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      count: await membersCol.countDocuments({ folderId: f.id }),
    })));

    return NextResponse.json({ success: true, folders: withCounts });
  } catch (error) {
    console.error('Error listando carpetas personales:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { name } = await request.json();
    const trimmed = String(name || '').trim().slice(0, 40);
    if (!trimmed) return NextResponse.json({ success: false, error: 'Ponle un nombre a la carpeta' }, { status: 400 });

    const col = await archivosFoldersCollection();
    const doc = { id: crypto.randomUUID(), discordId: me.id, name: trimmed, createdAt: new Date() };
    await col.insertOne(doc);

    return NextResponse.json({ success: true, folder: { ...doc, count: 0 } });
  } catch (error) {
    console.error('Error creando carpeta personal:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la carpeta' }, { status: 500 });
  }
}

/** action: 'rename' (requiere name) | 'delete' (también borra las asignaciones de objetos, no los objetos reales). */
export async function PATCH(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { folderId, action, name } = await request.json();
    const foldersCol = await archivosFoldersCollection();
    const folder = await foldersCol.findOne({ id: folderId, discordId: me.id });
    if (!folder) return NextResponse.json({ success: false, error: 'Carpeta no encontrada' }, { status: 404 });

    if (action === 'rename') {
      const trimmed = String(name || '').trim().slice(0, 40);
      if (!trimmed) return NextResponse.json({ success: false, error: 'Ponle un nombre a la carpeta' }, { status: 400 });
      await foldersCol.updateOne({ id: folderId }, { $set: { name: trimmed } });
    } else if (action === 'delete') {
      const membersCol = await archivosFolderMembersCollection();
      await membersCol.deleteMany({ folderId });
      await foldersCol.deleteOne({ id: folderId });
    } else {
      return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando carpeta personal:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
