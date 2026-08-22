import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logStaffAction, nextTicketNumber, staffIdentity, staffTickets, ticketCategories, type TicketStatus, type TicketPriority } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'closed'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

export async function GET(request: NextRequest) {
  const denied = await requirePermission('tickets.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '30', 10) || 30));
    const sort = searchParams.get('sort') === 'oldest' ? 1 : -1;

    const col = await staffTickets();
    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;

    const [docs, matched] = await Promise.all([
      col.find(query).sort({ updatedAt: sort }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col.countDocuments(query),
    ]);
    return NextResponse.json({
      success: true,
      tickets: docs.map(({ _id, ...t }: any) => t),
      page, pageSize, matched, totalPages: Math.max(1, Math.ceil(matched / pageSize)),
      open: await col.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    });
  } catch (error) {
    console.error('Error listando tickets:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requirePermission('tickets.view');
  if (denied) return denied;

  try {
    const { subject, category, priority, playerName, message } = await request.json();
    if (!subject?.trim() || !playerName?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos del ticket' }, { status: 400 });
    }

    const now = new Date();
    const col = await staffTickets();
    const doc = {
      id: crypto.randomUUID(),
      ticketNumber: await nextTicketNumber(col),
      subject: subject.trim(),
      category: category || 'Otro',
      priority: (PRIORITIES.includes(priority) ? priority : 'medium') as TicketPriority,
      playerName: playerName.trim(),
      status: 'open' as TicketStatus,
      messages: message?.trim()
        ? [{ author: playerName.trim(), authorRole: 'user' as const, body: message.trim(), createdAt: now }]
        : [],
      internalNotes: [],
      lastMessageFrom: 'user' as const,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc);
    const { _id, ...ticket } = doc as typeof doc & { _id?: unknown };

    const identity = staffIdentity();
    await logStaffAction({
      type: 'ticket_created',
      category: 'TICKET',
      actor: identity?.name || playerName.trim(),
      actorId: identity?.id,
      description: `Nuevo ticket abierto por ${doc.playerName} — categoría ${doc.category}`,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Error creando ticket:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear el ticket' }, { status: 500 });
  }
}

/** action: 'reply' | 'note' | 'status' | 'assign' */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('tickets.manage');
  if (denied) return denied;

  try {
    const { id, action, body, status, assignedTo, priority } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id del ticket' }, { status: 400 });

    const col = await staffTickets();
    const ticket = await col.findOne({ id });
    if (!ticket) return NextResponse.json({ success: false, error: 'Ticket no encontrado' }, { status: 404 });

    const identity = staffIdentity();
    const now = new Date();

    if (action === 'reply') {
      if (!body?.trim()) return NextResponse.json({ success: false, error: 'Escribe un mensaje' }, { status: 400 });
      await col.updateOne(
        { id },
        {
          $push: { messages: { author: identity?.name || 'Staff', authorRole: 'staff', body: body.trim(), createdAt: now } },
          $set: { updatedAt: now, lastMessageFrom: 'staff', status: ticket.status === 'open' ? 'in_progress' : ticket.status },
        }
      );
    } else if (action === 'note') {
      if (!body?.trim()) return NextResponse.json({ success: false, error: 'Escribe una nota' }, { status: 400 });
      await col.updateOne(
        { id },
        { $push: { internalNotes: { author: identity?.name || 'Staff', body: body.trim(), createdAt: now } } }
      );
    } else if (action === 'status') {
      if (!STATUSES.includes(status)) return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 });
      await col.updateOne(
        { id },
        { $set: { status, updatedAt: now, ...(status === 'closed' ? { closedAt: now } : {}) } }
      );
      if (status === 'closed') {
        await logStaffAction({
          type: 'ticket_closed',
          category: 'TICKET',
          actor: identity?.name || 'Staff',
          actorId: identity?.id,
          target: ticket.playerName,
          description: `${identity?.name || 'Staff'} cerró el ticket de ${ticket.playerName}`,
        });
      }
    } else if (action === 'assign') {
      await col.updateOne({ id }, { $set: { assignedTo: assignedTo || identity?.name, updatedAt: now } });
    } else if (action === 'priority') {
      if (!PRIORITIES.includes(priority)) return NextResponse.json({ success: false, error: 'Prioridad no válida' }, { status: 400 });
      await col.updateOne({ id }, { $set: { priority, updatedAt: now } });
    } else {
      return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }

    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, ticket: clean });
  } catch (error) {
    console.error('Error actualizando ticket:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar el ticket' }, { status: 500 });
  }
}
