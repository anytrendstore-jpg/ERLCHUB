import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentDiscordUser } from '@/lib/whitelistServer';
import { logStaffAction, nextTicketNumber, staffTickets, type TicketCategory, type TicketStatus } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

const CATEGORIES: TicketCategory[] = ['Soporte Técnico', 'Whitelist', 'Pagos', 'Reporte', 'Otro'];

const notLoggedIn = () =>
  NextResponse.json({ success: false, error: 'Inicia sesión con Discord para usar el soporte' }, { status: 401 });

/**
 * Versión de un ticket segura para devolver al jugador: sin `_id` de Mongo y,
 * sobre todo, SIN `internalNotes` — esas notas son solo para el staff y nunca
 * deben salir por esta ruta pública.
 */
function toPlayerSafeTicket(doc: Record<string, unknown>) {
  const { _id, internalNotes, ...safe } = doc as any;
  return safe;
}

/** Tickets del jugador que ha iniciado sesión (no requiere ser staff). */
export async function GET() {
  const user = currentDiscordUser();
  if (!user) return notLoggedIn();

  try {
    const col = await staffTickets();
    const docs = await col.find({ playerId: user.id }).sort({ updatedAt: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, tickets: docs.map(toPlayerSafeTicket) });
  } catch (error) {
    console.error('Error listando tickets del jugador:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** El jugador abre un ticket nuevo. Llega directo al panel de staff. */
export async function POST(request: NextRequest) {
  const user = currentDiscordUser();
  if (!user) return notLoggedIn();

  try {
    const { subject, category, message } = await request.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'Escribe un asunto y un mensaje' }, { status: 400 });
    }

    const playerName = user.global_name || user.username;
    const now = new Date();
    const col = await staffTickets();
    const doc = {
      id: crypto.randomUUID(),
      ticketNumber: await nextTicketNumber(col),
      subject: subject.trim().slice(0, 200),
      category: CATEGORIES.includes(category) ? (category as TicketCategory) : 'Otro',
      playerName,
      playerId: user.id,
      status: 'open' as TicketStatus,
      messages: [{ author: playerName, authorRole: 'user' as const, body: message.trim().slice(0, 2000), createdAt: now }],
      internalNotes: [],
      lastMessageFrom: 'user' as const,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);
    const ticket = toPlayerSafeTicket(doc);

    await logStaffAction({
      type: 'ticket_created',
      category: 'TICKET',
      actor: playerName,
      actorId: user.id,
      description: `Nuevo ticket abierto por ${playerName} — categoría ${ticket.category}`,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Error creando ticket:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el ticket' }, { status: 500 });
  }
}

/** El jugador responde en SU PROPIO ticket, mientras siga abierto. */
export async function PATCH(request: NextRequest) {
  const user = currentDiscordUser();
  if (!user) return notLoggedIn();

  try {
    const { id, body } = await request.json();
    if (!id || !body?.trim()) {
      return NextResponse.json({ success: false, error: 'Falta el mensaje' }, { status: 400 });
    }

    const col = await staffTickets();
    const ticket = await col.findOne({ id });
    if (!ticket || ticket.playerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Ticket no encontrado' }, { status: 404 });
    }
    if (ticket.status === 'closed') {
      return NextResponse.json({ success: false, error: 'Este ticket ya está cerrado' }, { status: 400 });
    }

    const now = new Date();
    const playerName = user.global_name || user.username;
    await col.updateOne(
      { id },
      {
        $push: { messages: { author: playerName, authorRole: 'user', body: body.trim().slice(0, 2000), createdAt: now } },
        $set: { updatedAt: now, lastMessageFrom: 'user', status: 'open' },
      }
    );

    const fresh = await col.findOne({ id });
    return NextResponse.json({ success: true, ticket: toPlayerSafeTicket(fresh as any) });
  } catch (error) {
    console.error('Error respondiendo el ticket:', error);
    return NextResponse.json({ success: false, error: 'No se pudo enviar el mensaje' }, { status: 500 });
  }
}
