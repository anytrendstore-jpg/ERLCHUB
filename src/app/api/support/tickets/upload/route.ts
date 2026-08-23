import { NextRequest, NextResponse } from 'next/server';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { staffTickets } from '@/lib/staffServer';
import { uploadTicketAttachment } from '@/lib/ticketAttachments';

export const dynamic = 'force-dynamic';

/** El jugador adjunta un archivo a SU PROPIO ticket, mientras siga abierto. */
export async function POST(request: NextRequest) {
  const user = currentDiscordUser();
  if (!user) return NextResponse.json({ success: false, error: 'Inicia sesión con Discord para usar el soporte' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const ticketId = form.get('ticketId');
    if (!(file instanceof File) || typeof ticketId !== 'string' || !ticketId) {
      return NextResponse.json({ success: false, error: 'Falta el archivo o el ticket' }, { status: 400 });
    }

    const col = await staffTickets();
    const ticket = await col.findOne({ id: ticketId });
    if (!ticket || ticket.playerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Ticket no encontrado' }, { status: 404 });
    }
    if (ticket.status === 'closed') {
      return NextResponse.json({ success: false, error: 'Este ticket ya está cerrado' }, { status: 400 });
    }

    const attachment = await uploadTicketAttachment(file, ticketId);
    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    console.error('Error subiendo adjunto de ticket:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo subir el archivo' }, { status: 500 });
  }
}
