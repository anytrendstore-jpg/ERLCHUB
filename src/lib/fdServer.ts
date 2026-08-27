import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import type { Firefighter, FireIncidentReport, FDMessage, IncidentCommand, FDEquipment, FDCertification } from '@/lib/fdTypes';

export interface FDFirefighterDoc extends Firefighter {
  discordId: string;
  updatedAt: Date;
}

export async function fdFirefightersCollection(): Promise<Collection<FDFirefighterDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<FDFirefighterDoc>('fd_firefighters');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ onDuty: 1 }).catch(() => {});
  return col;
}

export async function fdReportsCollection(): Promise<Collection<FireIncidentReport>> {
  const db = await connectToDatabase();
  const col = db.collection<FireIncidentReport>('fd_reports');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function fdMessagesCollection(): Promise<Collection<FDMessage>> {
  const db = await connectToDatabase();
  const col = db.collection<FDMessage>('fd_messages');
  await col.createIndex({ sentAt: -1 }).catch(() => {});
  await col.createIndex({ to: 1 }).catch(() => {});
  return col;
}

export async function fdIncidentCommandCollection(): Promise<Collection<IncidentCommand>> {
  const db = await connectToDatabase();
  const col = db.collection<IncidentCommand>('fd_incident_command');
  await col.createIndex({ callId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function fdEquipmentCollection(): Promise<Collection<FDEquipment>> {
  const db = await connectToDatabase();
  const col = db.collection<FDEquipment>('fd_equipment');
  await col.createIndex({ category: 1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function fdCertificationsCollection(): Promise<Collection<FDCertification>> {
  const db = await connectToDatabase();
  const col = db.collection<FDCertification>('fd_certifications');
  await col.createIndex({ firefighterId: 1 }).catch(() => {});
  await col.createIndex({ expiresAt: 1 }).catch(() => {});
  return col;
}

function randomBadge(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

/** Crea el perfil de bombero la primera vez que alguien entra a la terminal LSFD (no fabrica unidad/callsign: empieza sin asignar). */
export async function ensureFirefighterProfile(user: { id: string; username: string; displayName: string; avatar?: string }): Promise<FDFirefighterDoc> {
  const col = await fdFirefightersCollection();
  const existing = await col.findOne({ discordId: user.id });
  if (existing) return existing;

  const [firstName, ...rest] = user.displayName.split(' ');
  const doc: FDFirefighterDoc = {
    id: user.id,
    discordId: user.id,
    badgeNumber: randomBadge(),
    firstName: firstName || user.displayName,
    lastName: rest.join(' ') || '—',
    status: 'Available',
    onDuty: false,
    hireDate: new Date(),
    photoUrl: user.avatar,
    updatedAt: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}
