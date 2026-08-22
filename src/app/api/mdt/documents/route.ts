import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser, mdtDocumentsCollection, type DocumentSourceType } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

const SOURCE_TYPES: DocumentSourceType[] = ['report', 'arrest', 'citation', 'warrant', 'bolo'];

/** Personalización + bloqueo de documentos generados (Reportes/Arrestos/Multas/Órdenes/BOLOs). */
export async function GET(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });

  const sourceType = request.nextUrl.searchParams.get('sourceType') as DocumentSourceType | null;
  const sourceId = request.nextUrl.searchParams.get('sourceId');
  if (!sourceType || !SOURCE_TYPES.includes(sourceType) || !sourceId) {
    return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
  }

  try {
    const col = await mdtDocumentsCollection();
    const doc = await col.findOne({ sourceType, sourceId });
    if (!doc) return NextResponse.json({ success: true, override: null });
    const { _id, ...clean } = doc as any;
    return NextResponse.json({ success: true, override: clean });
  } catch (error) {
    console.error('Error leyendo override de documento:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/**
 * Body: { sourceType, sourceId, fieldOverrides?, sectionTextOverride?, lock? }
 * `lock: true` congela lo que venga en fieldOverrides/sectionTextOverride en esa misma
 * llamada (el caller manda el último estado mostrado) y ya no admite más ediciones.
 */
export async function PATCH(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });

  try {
    const body = await request.json();
    const { sourceType, sourceId, fieldOverrides, sectionTextOverride, lock } = body;
    if (!sourceType || !SOURCE_TYPES.includes(sourceType) || !sourceId) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
    }

    const col = await mdtDocumentsCollection();
    const existing = await col.findOne({ sourceType, sourceId });
    if (existing?.locked) {
      return NextResponse.json({ success: false, error: 'Este documento ya está bloqueado como PDF y no se puede modificar' }, { status: 409 });
    }

    const now = new Date();
    const lockedBy = user.displayName || user.username;

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (fieldOverrides && typeof fieldOverrides === 'object') updates.fieldOverrides = { ...existing.fieldOverrides, ...fieldOverrides };
      if (typeof sectionTextOverride === 'string') updates.sectionTextOverride = sectionTextOverride;
      if (lock === true) { updates.locked = true; updates.lockedAt = now; updates.lockedBy = lockedBy; }
      await col.updateOne({ sourceType, sourceId }, { $set: updates });
    } else {
      await col.insertOne({
        id: crypto.randomUUID(), sourceType, sourceId,
        fieldOverrides: fieldOverrides && typeof fieldOverrides === 'object' ? fieldOverrides : {},
        sectionTextOverride: typeof sectionTextOverride === 'string' ? sectionTextOverride : undefined,
        locked: lock === true,
        lockedAt: lock === true ? now : undefined,
        lockedBy: lock === true ? lockedBy : undefined,
        createdAt: now, updatedAt: now,
      });
    }

    const saved = await col.findOne({ sourceType, sourceId });
    const { _id, ...clean } = saved as any;
    return NextResponse.json({ success: true, override: clean });
  } catch (error) {
    console.error('Error guardando documento:', error);
    return NextResponse.json({ success: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}
