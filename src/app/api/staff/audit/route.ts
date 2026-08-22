import { NextRequest, NextResponse } from 'next/server';
import { requireStaff, staffAudit } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const actor = searchParams.get('actor')?.trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10) || 30));
    const sort = searchParams.get('sort') === 'oldest' ? 1 : -1;

    const col = await staffAudit();
    const query: Record<string, unknown> = {};
    if (category && category !== 'all') query.category = category;
    if (actor) query.actor = { $regex: actor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.$gte = new Date(from);
      if (to) range.$lte = new Date(to);
      query.createdAt = range;
    }

    const [docs, matched] = await Promise.all([
      col.find(query).sort({ createdAt: sort }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col.countDocuments(query),
    ]);
    return NextResponse.json({
      success: true,
      entries: docs.map(({ _id, ...a }: any) => a),
      page, pageSize, matched, totalPages: Math.max(1, Math.ceil(matched / pageSize)),
    });
  } catch (error) {
    console.error('Error leyendo el registro de auditoría:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
