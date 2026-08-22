import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { staffIdentity, logStaffAction } from '@/lib/staffServer';
import { requirePermission } from '@/lib/permissions/engine';
import {
  gangsCollection, gangSanctionsCollection, gangIncidentsCollection,
  type ThreatLevel, type GangStatus, type GangSanctionType,
} from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

const THREAT_LEVELS: ThreatLevel[] = ['low', 'medium', 'high', 'critical'];
const SANCTION_TYPES: GangSanctionType[] = ['warning', 'fine', 'restriction', 'suspension', 'disband'];

/** Requiere gangs.view. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('gangs.view');
  if (denied) return denied;

  try {
    const id = request.nextUrl.searchParams.get('id');
    const col = await gangsCollection();

    if (id) {
      const gang = await col.findOne({ id });
      if (!gang) return NextResponse.json({ success: false, error: 'Banda no encontrada' }, { status: 404 });
      const sCol = await gangSanctionsCollection();
      const iCol = await gangIncidentsCollection();
      const [sanctions, incidents] = await Promise.all([
        sCol.find({ gangId: id }).sort({ createdAt: -1 }).toArray(),
        iCol.find({ gangId: id }).sort({ createdAt: -1 }).toArray(),
      ]);
      const { _id, ...clean } = gang as any;
      return NextResponse.json({ success: true, gang: clean, sanctions: sanctions.map(({ _id, ...s }: any) => s), incidents: incidents.map(({ _id, ...i }: any) => i) });
    }

    const gangs = await col.find({}).sort({ threatLevel: -1, name: 1 }).toArray();
    const sCol = await gangSanctionsCollection();
    const activeSanctions = await sCol.countDocuments({ status: 'active' });
    return NextResponse.json({ success: true, gangs: gangs.map(({ _id, ...g }: any) => g), stats: { total: gangs.length, active: gangs.filter((g) => g.status === 'active').length, activeSanctions } });
  } catch (error) {
    console.error('Error leyendo bandas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Crear banda (registro administrativo). Requiere gangs.manage. */
export async function POST(request: NextRequest) {
  const denied = await requirePermission('gangs.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const { name, leaderName, territory, threatLevel } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre de la banda' }, { status: 400 });

    const col = await gangsCollection();
    const existing = await col.findOne({ name: name.trim() });
    if (existing) return NextResponse.json({ success: false, error: 'Ya existe una banda con ese nombre' }, { status: 409 });

    const now = new Date();
    const gang = {
      id: crypto.randomUUID(), name: name.trim(), leaderName: leaderName?.trim() || undefined,
      members: [], status: 'active' as GangStatus,
      threatLevel: (THREAT_LEVELS.includes(threatLevel) ? threatLevel : 'low') as ThreatLevel,
      territory: territory?.trim() || undefined, createdAt: now, updatedAt: now, updatedBy: identity.name,
    };
    await col.insertOne(gang);
    await logStaffAction({ type: 'gang_created', category: 'STAFF', actor: identity.name, actorId: identity.id, target: gang.name, description: `${identity.name} registró la banda ${gang.name}` });
    return NextResponse.json({ success: true, gang });
  } catch (error) {
    console.error('Error creando banda:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear la banda' }, { status: 500 });
  }
}

/**
 * Acciones (todas Director): edit_gang, change_threat, add_member,
 * remove_member, add_sanction, lift_sanction, add_incident, close_incident.
 */
export async function PATCH(request: NextRequest) {
  const denied = await requirePermission('gangs.manage');
  if (denied) return denied;

  try {
    const identity = staffIdentity();
    if (!identity) return NextResponse.json({ success: false, error: 'Sin identidad de staff' }, { status: 401 });

    const body = await request.json();
    const { gangId, action } = body;
    if (!gangId || !action) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });

    const col = await gangsCollection();
    const gang = await col.findOne({ id: gangId });
    if (!gang) return NextResponse.json({ success: false, error: 'Banda no encontrada' }, { status: 404 });

    const now = new Date();

    switch (action) {
      case 'edit_gang': {
        const updates: Record<string, unknown> = { updatedAt: now, updatedBy: identity.name };
        if (typeof body.leaderName === 'string') updates.leaderName = body.leaderName.trim() || undefined;
        if (typeof body.subleaderName === 'string') updates.subleaderName = body.subleaderName.trim() || undefined;
        if (typeof body.territory === 'string') updates.territory = body.territory.trim() || undefined;
        await col.updateOne({ id: gangId }, { $set: updates });
        break;
      }
      case 'change_status': {
        const status: GangStatus = body.status;
        if (!['active', 'suspended', 'disbanded'].includes(status)) return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
        await col.updateOne({ id: gangId }, { $set: { status, updatedAt: now, updatedBy: identity.name } });
        break;
      }
      case 'change_threat': {
        const threatLevel: ThreatLevel = body.threatLevel;
        if (!THREAT_LEVELS.includes(threatLevel)) return NextResponse.json({ success: false, error: 'Nivel de amenaza inválido' }, { status: 400 });
        await col.updateOne({ id: gangId }, { $set: { threatLevel, updatedAt: now, updatedBy: identity.name } });
        break;
      }
      case 'add_member': {
        if (!body.playerName?.trim()) return NextResponse.json({ success: false, error: 'Falta el nombre del miembro' }, { status: 400 });
        await col.updateOne({ id: gangId }, { $push: { members: { playerId: body.playerId, playerName: body.playerName.trim(), joinedAt: now } }, $set: { updatedAt: now } });
        break;
      }
      case 'remove_member': {
        if (!body.playerName?.trim()) return NextResponse.json({ success: false, error: 'Falta el miembro' }, { status: 400 });
        await col.updateOne({ id: gangId }, { $pull: { members: { playerName: body.playerName } }, $set: { updatedAt: now } });
        break;
      }
      case 'add_sanction': {
        const type: GangSanctionType = body.sanctionType;
        if (!SANCTION_TYPES.includes(type) || !body.reason?.trim()) return NextResponse.json({ success: false, error: 'Datos de sanción inválidos' }, { status: 400 });
        const sCol = await gangSanctionsCollection();
        const sanction = {
          id: crypto.randomUUID(), gangId, gangName: gang.name, type, reason: body.reason.trim(),
          durationHours: typeof body.durationHours === 'number' ? body.durationHours : undefined,
          staffResponsible: identity.name, evidence: Array.isArray(body.evidence) ? body.evidence : [],
          status: 'active' as const, createdAt: now,
        };
        await sCol.insertOne(sanction);
        if (type === 'disband') await col.updateOne({ id: gangId }, { $set: { status: 'disbanded', updatedAt: now } });
        await logStaffAction({ type: 'gang_sanction_issued', category: 'SANCION', actor: identity.name, actorId: identity.id, target: gang.name, description: `${identity.name} aplicó una sanción (${type}) a la banda ${gang.name}` });
        return NextResponse.json({ success: true, sanction });
      }
      case 'lift_sanction': {
        if (!body.sanctionId) return NextResponse.json({ success: false, error: 'Falta la sanción' }, { status: 400 });
        const sCol = await gangSanctionsCollection();
        await sCol.updateOne({ id: body.sanctionId }, { $set: { status: 'lifted', liftedAt: now, liftedBy: identity.name } });
        await logStaffAction({ type: 'gang_sanction_lifted', category: 'SANCION', actor: identity.name, actorId: identity.id, target: gang.name, description: `${identity.name} levantó una sanción de la banda ${gang.name}` });
        return NextResponse.json({ success: true });
      }
      case 'add_incident': {
        if (!body.type?.trim()) return NextResponse.json({ success: false, error: 'Falta el tipo de incidente' }, { status: 400 });
        const iCol = await gangIncidentsCollection();
        const incident = {
          id: crypto.randomUUID(), gangId, gangName: gang.name, location: body.location?.trim() || undefined,
          involvedNames: Array.isArray(body.involvedNames) ? body.involvedNames : [], type: body.type.trim(),
          evidence: Array.isArray(body.evidence) ? body.evidence : [], status: 'open' as const, createdAt: now,
        };
        await iCol.insertOne(incident);
        await logStaffAction({ type: 'gang_incident_logged', category: 'STAFF', actor: identity.name, actorId: identity.id, target: gang.name, description: `${identity.name} registró un incidente de la banda ${gang.name}` });
        return NextResponse.json({ success: true, incident });
      }
      case 'close_incident': {
        if (!body.incidentId) return NextResponse.json({ success: false, error: 'Falta el incidente' }, { status: 400 });
        const iCol = await gangIncidentsCollection();
        await iCol.updateOne({ id: body.incidentId }, { $set: { status: 'closed' } });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: 'Acción desconocida' }, { status: 400 });
    }

    await logStaffAction({ type: 'gang_updated', category: 'STAFF', actor: identity.name, actorId: identity.id, target: gang.name, description: `${identity.name} actualizó la banda ${gang.name} (${action})` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando banda:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar la banda' }, { status: 500 });
  }
}
