import type { Collection } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { currentDiscordUser, resolvePlayerIdentity } from '@/lib/whitelistServer';

export type ArchivoItemType = 'compras' | 'armas' | 'vehiculos' | 'propiedades' | 'facturas';
export type TransferableItemType = 'armas' | 'vehiculos' | 'propiedades';

export interface ArchivoHiddenDoc {
  discordId: string;
  itemType: ArchivoItemType;
  itemId: string;
  permanent: boolean;
  hiddenAt: Date;
}

export interface ItemTransferDoc {
  id: string;
  itemType: ArchivoItemType;
  itemId: string;
  itemName: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  transferredAt: Date;
}

export interface ArchivoFolderDoc {
  id: string;
  discordId: string;
  name: string;
  createdAt: Date;
}

export interface ArchivoFolderMemberDoc {
  folderId: string;
  discordId: string;
  itemType: ArchivoItemType;
  itemId: string;
  addedAt: Date;
}

export async function currentArchivosUser(): Promise<{ id: string; username: string; displayName: string; avatar?: string } | null> {
  const user = currentDiscordUser();
  if (!user) return null;
  const discordAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const identity = await resolvePlayerIdentity(user.id, { username: user.global_name || user.username, avatar: discordAvatar });
  return { id: user.id, ...identity };
}

export async function archivosHiddenCollection(): Promise<Collection<ArchivoHiddenDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<ArchivoHiddenDoc>('archivos_hidden');
  await col.createIndex({ discordId: 1, itemType: 1, itemId: 1 }, { unique: true }).catch(() => {});
  return col;
}

export async function itemTransfersCollection(): Promise<Collection<ItemTransferDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<ItemTransferDoc>('item_transfers');
  await col.createIndex({ itemType: 1, itemId: 1, transferredAt: -1 }).catch(() => {});
  return col;
}

export async function archivosFoldersCollection(): Promise<Collection<ArchivoFolderDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<ArchivoFolderDoc>('archivos_folders');
  await col.createIndex({ discordId: 1 }).catch(() => {});
  return col;
}

export async function archivosFolderMembersCollection(): Promise<Collection<ArchivoFolderMemberDoc>> {
  const db = await connectToDatabase();
  const col = db.collection<ArchivoFolderMemberDoc>('archivos_folder_members');
  await col.createIndex({ folderId: 1, itemType: 1, itemId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ discordId: 1, itemType: 1, itemId: 1 }).catch(() => {});
  return col;
}
