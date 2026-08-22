import { NextResponse } from 'next/server';
import { ensureOsModulesSeeded, currentOSUserId } from '@/lib/osServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await currentOSUserId())) {
    return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  }

  try {
    const col = await ensureOsModulesSeeded();
    const docs = await col.find({}).toArray();
    return NextResponse.json({ success: true, modules: docs.map(({ _id, ...m }: any) => m) });
  } catch (error) {
    console.error('Error leyendo módulos del OS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
