import { NextRequest, NextResponse } from 'next/server';
import { currentSocialUser } from '@/lib/socialServer';
import { requirePermission } from '@/lib/permissions/engine';
import { uploadSocialImage } from '@/lib/socialUploads';

export const dynamic = 'force-dynamic';

/** Sube una imagen recortada (avatar/portada) para HubSocial — accesible tanto a un jugador
 * logueado (su propio avatar) como a staff (páginas/cuentas institucionales). */
export async function POST(request: NextRequest) {
  const user = await currentSocialUser();
  if (!user) {
    const denied = await requirePermission('hubsocial.moderate');
    if (denied) return denied;
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Falta el archivo' }, { status: 400 });
    }

    const url = await uploadSocialImage(file, 'social');
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Error subiendo imagen de HubSocial:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo subir la imagen' }, { status: 500 });
  }
}
