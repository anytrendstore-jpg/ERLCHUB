import { NextRequest, NextResponse } from 'next/server';
import { staffTickets } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import { uploadTicketAttachment } from '@/lib/ticketAttachments';

export const dynamic = 'force-dynamic';

/** El staff adjunta un archivo a un ticket, como parte de su respuesta. */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('tickets.manage');
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');
    const ticketId = form.get('ticketId');
    if (!(file instanceof File) || typeof ticketId !== 'string' || !ticketId) {
      return NextResponse.json({ success: false, error: 'Falta el archivo o el ticket' }, { status: 400 });
    }

    const col = await staffTickets();
    const ticket = await col.findOne({ id: ticketId });
    if (!ticket) return NextResponse.json({ success: false, error: 'Ticket no encontrado' }, { status: 404 });

    const attachment = await uploadTicketAttachment(file, ticketId);
    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    console.error('Error subiendo adjunto de ticket (staff):', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo subir el archivo' }, { status: 500 });
  }
}
