import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import {
  legalFactionsCollection, factionTransactionsCollection, recordFactionAudit, defaultRanks,
  addFactionMember, removeFactionMember, changeFactionMemberRank, addFactionRank, updateFactionRank, deleteFactionRank,
  type FactionStatus, type FactionTransactionType,
} from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

const STATUSES: FactionStatus[] = ['operational', 'reduced', 'review', 'suspended', 'inactive'];
const TX_TYPES: FactionTransactionType[] = ['income', 'expense', 'salary', 'purchase', 'transfer'];

/** Requiere factions.view. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('factions.view');
  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get('id');
    const col = await legalFactionsCollection();

    if (id) {
      const faction = await col.findOne({ id });
      if (!faction) return NextResponse.json({ success: false, error: 'Facción no encontrada' }, { status: 404 });
      const txCol = await factionTransactionsCollection();
      const transactions = await txCol.find({ factionId: id }).sort({ createdAt: -1 }).limit(100).toArray();
      const { _id, ...clean } = faction as any;
      return NextResponse.json({ success: true, faction: clean, transactions: transactions.map(({ _id, ...t }: any) => t) });
    }

    const factions = await col.find({}).sort({ name: 1 }).toArray();
    const stats = {
      totalFactions: factions.length,
      operational: factions.filter((f) => f.status === 'operational').length,
      totalMembers: factions.reduce((sum, f) => sum + f.members.filter((m) => m.status === 'active').length, 0),
      totalBudget: factions.reduce((sum, f) => sum + f.budget, 0),
    };
    return NextResponse.json({ success: true, factions: factions.map(({ _id, ...f }: any) => f), stats });
  } catch (error) {
    console.error('Error leyendo facciones:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crear una nueva facción legal. Requiere factions.manage. */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('factions.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { name, abbreviation, description } = await request.json();
    if (!name?.trim() || !abbreviation?.trim()) {
      return NextResponse.json({ success: false, error: 'Nombre y abreviatura son obligatorios' }, { status: 400 });
    }

    const col = await legalFactionsCollection();
    const existing = await col.findOne({ name: name.trim() });
    if (existing) return NextResponse.json({ success: false, error: 'Ya existe una facción con ese nombre' }, { status: 409 });

    const now = new Date();
    const faction = {
      id: crypto.randomUUID(), name: name.trim(), abbreviation: abbreviation.trim().toUpperCase(),
      description: description?.trim() || undefined, status: 'operational' as FactionStatus,
      ranks: defaultRanks(), members: [], budget: 0, createdAt: now, updatedAt: now, updatedBy: identity.name,
    };
    await col.insertOne(faction);
    await recordFactionAudit({ factionId: faction.id, factionName: faction.name, action: 'faction_created', actorId: identity.id, actorName: identity.name, newValue: faction.name });
    await logStaffAction({ type: 'faction_created', category: 'STAFF', actor: identity.name, actorId: identity.id, target: faction.name, description: `${identity.name} creó la facción ${faction.name}` });
    return NextResponse.json({ success: true, faction });
  } catch (error) {
    console.error('Error creando facción:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la facción' }, { status: 500 });
  }
}

/**
 * Acciones (todas Director): edit_faction, change_status, transfer_director,
 * add_member, remove_member, change_member_rank, add_rank, update_rank,
 * delete_rank, add_transaction.
 */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('factions.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const body = await request.json();
    const { factionId, action } = body;
    if (!factionId || !action) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });

    const col = await legalFactionsCollection();
    const faction = await col.findOne({ id: factionId });
    if (!faction) return NextResponse.json({ success: false, error: 'Facción no encontrada' }, { status: 404 });

    const now = new Date();

    switch (action) {
      case 'edit_faction': {
        const updates: Record<string, unknown> = { updatedAt: now, updatedBy: identity.name };
        if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
        if (typeof body.abbreviation === 'string' && body.abbreviation.trim()) updates.abbreviation = body.abbreviation.trim().toUpperCase();
        if (typeof body.description === 'string') updates.description = body.description.trim() || undefined;
        if (typeof body.budget === 'number') updates.budget = body.budget;
        await col.updateOne({ id: factionId }, { $set: updates });
        await recordFactionAudit({ factionId, factionName: faction.name, action: 'faction_updated', actorId: identity.id, actorName: identity.name });
        break;
      }
      case 'change_status': {
        const status: FactionStatus = body.status;
        if (!STATUSES.includes(status)) return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
        await col.updateOne({ id: factionId }, { $set: { status, updatedAt: now, updatedBy: identity.name } });
        await recordFactionAudit({ factionId, factionName: faction.name, action: 'status_changed', actorId: identity.id, actorName: identity.name, previousValue: faction.status, newValue: status, reason: body.reason });
        break;
      }
      case 'transfer_director': {
        if (!body.directorName?.trim()) return NextResponse.json({ success: false, error: 'Falta el nuevo director' }, { status: 400 });
        await col.updateOne({ id: factionId }, { $set: { directorId: body.directorId, directorName: body.directorName.trim(), subdirectorId: body.subdirectorId, subdirectorName: body.subdirectorName?.trim() || undefined, updatedAt: now, updatedBy: identity.name } });
        await recordFactionAudit({ factionId, factionName: faction.name, action: 'director_changed', actorId: identity.id, actorName: identity.name, previousValue: faction.directorName, newValue: body.directorName.trim() });
        break;
      }
      case 'add_member': {
        const result = await addFactionMember(faction, body, identity);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        break;
      }
      case 'remove_member': {
        const result = await removeFactionMember(faction, body, identity);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        break;
      }
      case 'change_member_rank': {
        const result = await changeFactionMemberRank(faction, body, identity);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        break;
      }
      case 'add_rank': {
        const result = await addFactionRank(faction, body, identity);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        break;
      }
      case 'update_rank': {
        const result = await updateFactionRank(faction, body, identity);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        break;
      }
      case 'delete_rank': {
        const result = await deleteFactionRank(faction, body, identity);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        break;
      }
      case 'add_transaction': {
        const type: FactionTransactionType = body.txType;
        const amount = Number(body.amount);
        if (!TX_TYPES.includes(type) || !amount || !body.reason?.trim()) return NextResponse.json({ success: false, error: 'Datos de transacción inválidos' }, { status: 400 });
        const txCol = await factionTransactionsCollection();
        const tx = { id: crypto.randomUUID(), factionId, factionName: faction.name, type, amount, responsible: identity.name, reason: body.reason.trim(), createdAt: now };
        await txCol.insertOne(tx);
        const delta = type === 'expense' || type === 'salary' || type === 'purchase' ? -Math.abs(amount) : Math.abs(amount);
        await col.updateOne({ id: factionId }, { $inc: { budget: delta }, $set: { updatedAt: now } });
        await recordFactionAudit({ factionId, factionName: faction.name, action: 'transaction', actorId: identity.id, actorName: identity.name, newValue: `${type} ${amount}`, reason: body.reason.trim() });
        break;
      }
      default:
        return NextResponse.json({ success: false, error: 'Acción desconocida' }, { status: 400 });
    }

    await logStaffAction({ type: 'faction_updated', category: 'STAFF', actor: identity.name, actorId: identity.id, target: faction.name, description: `${identity.name} realizó "${action}" en la facción ${faction.name}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando facción:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar la facción' }, { status: 500 });
  }
}
