import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import crypto from 'crypto';
import type { Firefighter, FireIncidentReport, FDMessage, IncidentCommand, FDEquipment, FDCertification, FDCase, FDPatient, FDBudgetEntry, FDServiceOrder, FDMutualAidRequest, FDIncidentTimelineEntry, FDStation, FDShift, FDPromotion, FDSanction, FDAuditLog, FDAuditAction } from '@/lib/fdTypes';

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

export async function fdCasesCollection(): Promise<Collection<FDCase>> {
  const db = await connectToDatabase();
  const col = db.collection<FDCase>('fd_cases');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function fdPatientsCollection(): Promise<Collection<FDPatient>> {
  const db = await connectToDatabase();
  const col = db.collection<FDPatient>('fd_patients');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ callId: 1 }).catch(() => {});
  return col;
}

export async function fdBudgetCollection(): Promise<Collection<FDBudgetEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<FDBudgetEntry>('fd_budget');
  await col.createIndex({ date: -1 }).catch(() => {});
  return col;
}

export async function fdServiceOrdersCollection(): Promise<Collection<FDServiceOrder>> {
  const db = await connectToDatabase();
  const col = db.collection<FDServiceOrder>('fd_service_orders');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  await col.createIndex({ status: 1 }).catch(() => {});
  return col;
}

export async function fdMutualAidCollection(): Promise<Collection<FDMutualAidRequest>> {
  const db = await connectToDatabase();
  const col = db.collection<FDMutualAidRequest>('fd_mutual_aid');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

export async function fdIncidentTimelineCollection(): Promise<Collection<FDIncidentTimelineEntry>> {
  const db = await connectToDatabase();
  const col = db.collection<FDIncidentTimelineEntry>('fd_incident_timeline');
  await col.createIndex({ callId: 1, timestamp: 1 }).catch(() => {});
  return col;
}

/** Registra un evento real del incidente — llamado server-side desde fd/calls y fd/command al mutar, nunca expuesto como endpoint público de escritura. */
export async function logIncidentEvent(entry: { callId: string; event: string; description: string; actorId: string; actorName: string }): Promise<void> {
  const col = await fdIncidentTimelineCollection();
  const doc: FDIncidentTimelineEntry = { id: crypto.randomUUID(), timestamp: new Date(), ...entry };
  await col.insertOne(doc).catch(() => {});
}

export async function fdStationsCollection(): Promise<Collection<FDStation>> {
  const db = await connectToDatabase();
  const col = db.collection<FDStation>('fd_stations');
  await col.createIndex({ name: 1 }).catch(() => {});
  return col;
}

export async function fdShiftsCollection(): Promise<Collection<FDShift>> {
  const db = await connectToDatabase();
  const col = db.collection<FDShift>('fd_shifts');
  await col.createIndex({ firefighterId: 1, start: -1 }).catch(() => {});
  return col;
}

export async function fdPromotionsCollection(): Promise<Collection<FDPromotion>> {
  const db = await connectToDatabase();
  const col = db.collection<FDPromotion>('fd_promotions');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

export async function fdSanctionsCollection(): Promise<Collection<FDSanction>> {
  const db = await connectToDatabase();
  const col = db.collection<FDSanction>('fd_sanctions');
  await col.createIndex({ createdAt: -1 }).catch(() => {});
  return col;
}

export async function fdAuditCollection(): Promise<Collection<FDAuditLog>> {
  const db = await connectToDatabase();
  const col = db.collection<FDAuditLog>('fd_audit');
  await col.createIndex({ timestamp: -1 }).catch(() => {});
  return col;
}

/** Registra una entrada de auditoría — llamado server-side desde otras rutas /api/fd/*, nunca expuesto como endpoint público (evita entradas forjadas desde el cliente). */
export async function logFDAudit(entry: { firefighterId: string; firefighterName: string; action: FDAuditAction; description: string }): Promise<void> {
  const col = await fdAuditCollection();
  const doc: FDAuditLog = { id: crypto.randomUUID(), timestamp: new Date(), ...entry };
  await col.insertOne(doc).catch(() => {});
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
