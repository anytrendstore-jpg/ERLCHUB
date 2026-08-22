import type { Collection } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';
import { notifyUser } from '@/lib/notificationsServer';

/** Red profesional (HubCareer) — perfiles, experiencia, educación, habilidades y conexiones. */

export interface WorkExperience {
  id: string;
  title: string;
  companyId?: string;
  companyName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  program: string;
  startDate: string;
  endDate?: string;
  description?: string;
  certification?: string;
}

export interface Skill {
  id: string;
  name: string;
  endorsements: string[];
}

export interface CurrentJob {
  title: string;
  companyId: string;
  companyName: string;
  since: Date;
}

export interface ProfessionalProfile {
  discordId: string;
  displayName: string;
  avatar?: string;
  coverImage?: string;
  headline: string;
  bio: string;
  location: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: string[];
  /** Trabajo actual — solo se fija automáticamente al aceptar una postulación, nunca editable a mano. */
  currentJob?: CurrentJob;
  verified: boolean;
  verifiedBy?: string;
  privacy: {
    profile: 'public' | 'connections' | 'private';
    experience: 'public' | 'connections' | 'private';
    connections: 'public' | 'connections' | 'private';
  };
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  status: ConnectionStatus;
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export type ReportTargetType = 'user' | 'post' | 'company';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export async function currentCareerUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function careerProfilesCollection(): Promise<Collection<ProfessionalProfile>> {
  const db = await connectToDatabase();
  const col = db.collection<ProfessionalProfile>('career_profiles');
  await col.createIndex({ discordId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function careerConnectionsCollection(): Promise<Collection<Connection>> {
  const db = await connectToDatabase();
  const col = db.collection<Connection>('career_connections');
  await col.createIndex({ fromId: 1, toId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ toId: 1, status: 1 }).catch(() => {});
  return col;
}

export async function careerBlocksCollection(): Promise<Collection<Block>> {
  const db = await connectToDatabase();
  const col = db.collection<Block>('career_blocks');
  await col.createIndex({ blockerId: 1, blockedId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function careerReportsCollection(): Promise<Collection<Report>> {
  const db = await connectToDatabase();
  const col = db.collection<Report>('career_reports');
  await col.createIndex({ status: 1, createdAt: -1 }).catch(() => {});
  return col;
}

export async function toggleBlockUser(blockerId: string, blockedId: string): Promise<{ ok: boolean; blocked?: boolean; error?: string }> {
  if (blockerId === blockedId) return { ok: false, error: 'No puedes bloquearte a ti mismo' };
  const col = await careerBlocksCollection();
  const existing = await col.findOne({ blockerId, blockedId });
  if (existing) {
    await col.deleteOne({ id: existing.id });
    return { ok: true, blocked: false };
  }
  await col.insertOne({ id: crypto.randomUUID(), blockerId, blockedId, createdAt: new Date() });
  // Bloquear rompe cualquier conexión existente entre ambos, en cualquier dirección.
  const connCol = await careerConnectionsCollection();
  await connCol.deleteMany({ $or: [{ fromId: blockerId, toId: blockedId }, { fromId: blockedId, toId: blockerId }] });
  return { ok: true, blocked: true };
}

export async function submitReport(reporter: { id: string; displayName: string }, data: { targetType: ReportTargetType; targetId: string; targetLabel: string; reason: string }): Promise<{ ok: boolean; error?: string }> {
  if (!data.reason.trim()) return { ok: false, error: 'Describe el motivo del reporte' };
  const col = await careerReportsCollection();
  await col.insertOne({
    id: crypto.randomUUID(), reporterId: reporter.id, reporterName: reporter.displayName,
    targetType: data.targetType, targetId: data.targetId, targetLabel: data.targetLabel, reason: data.reason.trim(),
    status: 'pending', createdAt: new Date(),
  });
  return { ok: true };
}

export async function getOrCreateProfile(user: { id: string; displayName: string; avatar?: string }): Promise<ProfessionalProfile> {
  const col = await careerProfilesCollection();
  const now = new Date();
  const result = await col.findOneAndUpdate(
    { discordId: user.id },
    {
      $setOnInsert: {
        discordId: user.id, displayName: user.displayName, avatar: user.avatar, headline: '', bio: '', location: '',
        experience: [], education: [], skills: [], languages: [], verified: false,
        privacy: { profile: 'public', experience: 'public', connections: 'public' },
        profileViews: 0, createdAt: now, updatedAt: now,
      },
      $set: { displayName: user.displayName, avatar: user.avatar },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return result!;
}

export async function areConnected(a: string, b: string): Promise<boolean> {
  const col = await careerConnectionsCollection();
  const conn = await col.findOne({
    $or: [{ fromId: a, toId: b }, { fromId: b, toId: a }],
    status: 'accepted',
  });
  return Boolean(conn);
}

export async function isBlocked(a: string, b: string): Promise<boolean> {
  const col = await careerBlocksCollection();
  const block = await col.findOne({ $or: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] });
  return Boolean(block);
}

export async function sendConnectionRequest(fromId: string, toId: string, message?: string): Promise<{ ok: boolean; error?: string }> {
  if (fromId === toId) return { ok: false, error: 'No puedes conectar contigo mismo' };
  if (await isBlocked(fromId, toId)) return { ok: false, error: 'No puedes contactar a este usuario' };

  const col = await careerConnectionsCollection();
  const existing = await col.findOne({ $or: [{ fromId, toId }, { fromId: toId, toId: fromId }] });
  if (existing?.status === 'accepted') return { ok: false, error: 'Ya están conectados' };
  if (existing?.status === 'pending') return { ok: false, error: 'Ya hay una invitación pendiente' };

  const fromProfile = await getOrCreateProfile(await resolveProfileUser(fromId));
  const doc: Connection = { id: crypto.randomUUID(), fromId, toId, status: 'pending', message, createdAt: new Date() };
  if (existing) {
    await col.updateOne({ id: existing.id }, { $set: { status: 'pending', message, createdAt: new Date(), fromId, toId } });
  } else {
    await col.insertOne(doc);
  }
  await notifyUser(toId, { title: 'Nueva invitación de contacto', message: `${fromProfile.displayName} quiere conectar contigo en HubCareer`, type: 'info', appId: 'hubcareer' });
  return { ok: true };
}

export async function respondConnectionRequest(userId: string, connectionId: string, accept: boolean): Promise<{ ok: boolean; error?: string }> {
  const col = await careerConnectionsCollection();
  const conn = await col.findOne({ id: connectionId, toId: userId, status: 'pending' });
  if (!conn) return { ok: false, error: 'Invitación no encontrada' };

  await col.updateOne({ id: connectionId }, { $set: { status: accept ? 'accepted' : 'declined', respondedAt: new Date() } });
  if (accept) {
    const profile = await getOrCreateProfile(await resolveProfileUser(userId));
    await notifyUser(conn.fromId, { title: 'Invitación aceptada', message: `${profile.displayName} aceptó tu invitación de contacto`, type: 'success', appId: 'hubcareer' });
  }
  return { ok: true };
}

async function resolveProfileUser(discordId: string): Promise<{ id: string; displayName: string; avatar?: string }> {
  const identity = await resolvePlayerIdentity(discordId, { username: discordId });
  return { id: discordId, displayName: identity.displayName, avatar: identity.avatar };
}

export async function getConnectionIds(discordId: string): Promise<string[]> {
  const col = await careerConnectionsCollection();
  const docs = await col.find({ $or: [{ fromId: discordId }, { toId: discordId }], status: 'accepted' }).toArray();
  return docs.map((d) => (d.fromId === discordId ? d.toId : d.fromId));
}

export interface Recommendation { discordId: string; displayName: string; avatar?: string; headline: string; reason: string }

/** "Personas que quizás conozcas": misma empresa, contactos en común y misma ubicación — nunca al azar. */
export async function getRecommendations(discordId: string, limit = 10): Promise<Recommendation[]> {
  const [profilesCol, myConnections, blocksCol, connCol] = await Promise.all([
    careerProfilesCollection(), getConnectionIds(discordId), careerBlocksCollection(), careerConnectionsCollection(),
  ]);
  const me = await profilesCol.findOne({ discordId });
  if (!me) return [];

  const [blockedByMe, blockedMe, pending] = await Promise.all([
    blocksCol.find({ blockerId: discordId }).toArray(),
    blocksCol.find({ blockedId: discordId }).toArray(),
    connCol.find({ $or: [{ fromId: discordId }, { toId: discordId }], status: 'pending' }).toArray(),
  ]);
  const excluded = new Set([
    discordId, ...myConnections,
    ...blockedByMe.map((b) => b.blockedId), ...blockedMe.map((b) => b.blockerId),
    ...pending.map((p) => (p.fromId === discordId ? p.toId : p.fromId)),
  ]);

  const scores = new Map<string, { score: number; reasons: string[] }>();
  const bump = (id: string, points: number, reason: string) => {
    if (excluded.has(id)) return;
    const entry = scores.get(id) || { score: 0, reasons: [] };
    entry.score += points;
    if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
    scores.set(id, entry);
  };

  // Misma empresa actual.
  if (me.currentJob?.companyId) {
    const colleagues = await profilesCol.find({ 'currentJob.companyId': me.currentJob.companyId }).project({ discordId: 1 }).toArray();
    for (const c of colleagues) bump(c.discordId, 3, `Trabaja en ${me.currentJob.companyName}`);
  }

  // Contactos en común (amigos de mis contactos).
  if (myConnections.length > 0) {
    const theirConnections = await connCol.find({
      status: 'accepted',
      $or: [{ fromId: { $in: myConnections } }, { toId: { $in: myConnections } }],
    }).toArray();
    for (const c of theirConnections) {
      const other = myConnections.includes(c.fromId) ? c.toId : c.fromId;
      bump(other, 2, 'Contacto en común');
    }
  }

  // Misma ubicación.
  if (me.location?.trim()) {
    const sameLocation = await profilesCol.find({ location: me.location }).project({ discordId: 1 }).toArray();
    for (const l of sameLocation) bump(l.discordId, 1, `En ${me.location}`);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, limit);
  if (ranked.length === 0) return [];

  const profiles = await profilesCol.find({ discordId: { $in: ranked.map(([id]) => id) } }).toArray();
  const profileById = new Map(profiles.map((p) => [p.discordId, p]));

  return ranked.map(([id, { reasons }]) => {
    const p = profileById.get(id);
    return { discordId: id, displayName: p?.displayName || id, avatar: p?.avatar, headline: p?.headline || '', reason: reasons[0] };
  });
}
