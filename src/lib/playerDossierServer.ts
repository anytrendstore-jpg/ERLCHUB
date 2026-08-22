import { connectToDatabase } from '@/lib/mongodb';
import { applications as whitelistApplications, resolvePlayerIdentity } from '@/lib/whitelistServer';
import { staffSanctions, staffReports, staffTickets, staffAudit } from '@/lib/staffServer';
import {
  usersCollection, hubPayTransactionsCollection, hubPayPocketsCollection,
  hubPayCardsCollection, hubPayAccountsCollection,
} from '@/lib/hubPayServer';
import { cryptoWalletsCollection, cryptoTransactionsCollection, getWalletSummary } from '@/lib/cryptoServer';
import { archivosHiddenCollection, itemTransfersCollection } from '@/lib/archivosServer';
import { playerLicensesCollection, playerWeaponsCollection } from '@/lib/ammoServer';
import { playerPropertiesCollection } from '@/lib/propertiesServer';
import { playerVehiclesCollection } from '@/lib/dealerServer';
import { marketplacePurchasesCollection } from '@/lib/marketplaceServer';
import { socialProfilesCollection, socialProfileStats } from '@/lib/socialServer';
import { careerProfilesCollection } from '@/lib/hubCareerServer';
import { applicationsCollection as careerApplicationsCollection, companiesCollection as careerCompaniesCollection } from '@/lib/hubCareerJobsServer';
import { vpsSubscriptionsCollection } from '@/lib/vpsServer';
import { playerDeepWebItemsCollection } from '@/lib/deepwebServer';
import { deepWebStateCollection, exposureTier } from '@/lib/deepwebSessionServer';
import { casinoBetsCollection } from '@/lib/casinoServer';
import { osUserPreferencesCollection } from '@/lib/osServer';

/* ------------------------------------------------------------------ *
 * Expediente administrativo 360° del jugador — agrega en una sola
 * llamada TODO lo que el sistema tiene registrado sobre un discordId,
 * consultando cada colección real por separado (nunca se inventa ni
 * se calcula un dato que no exista: si algo no está, queda `null` o
 * arreglo vacío y la UI debe mostrar "No registrado").
 *
 * Solo lectura: usa findOne/find directos en vez de los helpers
 * resolveVpsState()/getDeepWebState() porque esos tienen efectos de
 * lado (escriben, cobran cripto, mandan notificaciones) — un
 * expediente de consulta no debe disparar nada de eso.
 * ------------------------------------------------------------------ */

function stripIds<T extends { _id?: unknown }>(docs: T[]): Omit<T, '_id'>[] {
  return docs.map(({ _id, ...rest }) => rest);
}

export async function getPlayerDossier(discordId: string) {
  const db = await connectToDatabase();

  const [
    user,
    whitelist,
    hubPayTx, hubPayPockets, hubPayCards, hubPayAccounts,
    hubCoinsTx,
    cryptoWallet, cryptoSummary, cryptoTx,
    hiddenItems, transfersOut, transfersIn,
    licenses, weapons,
    properties,
    vehicles,
    purchasesAsBuyer, purchasesAsSeller,
    socialProfile, socialStats,
    careerProfile, careerApplications, careerCompanies,
    vpsSubs,
    deepWebItems, deepWebState,
    casinoBets,
    sanctions, reportsMade, tickets, auditEntries,
    osPreferences,
    referralCode, referralsMade, referredBy,
  ] = await Promise.all([
    db.collection('users').findOne({ discordId }),
    whitelistApplications().then((c) => c.findOne({ discordId })),
    hubPayTransactionsCollection().then((c) => c.find({ userId: discordId }).sort({ timestamp: -1 }).limit(50).toArray()),
    hubPayPocketsCollection().then((c) => c.find({ discordId }).toArray()),
    hubPayCardsCollection().then((c) => c.find({ discordId }).toArray()),
    hubPayAccountsCollection().then((c) => c.find({ discordId }).toArray()),
    db.collection('hubcoins_transactions').find({ userId: discordId }).sort({ timestamp: -1 }).limit(50).toArray(),
    cryptoWalletsCollection().then((c) => c.findOne({ discordId })),
    getWalletSummary(discordId).catch(() => null),
    cryptoTransactionsCollection().then((c) => c.find({ discordId }).sort({ createdAt: -1 }).limit(30).toArray()),
    archivosHiddenCollection().then((c) => c.find({ discordId }).toArray()),
    itemTransfersCollection().then((c) => c.find({ fromId: discordId }).sort({ transferredAt: -1 }).limit(20).toArray()),
    itemTransfersCollection().then((c) => c.find({ toId: discordId }).sort({ transferredAt: -1 }).limit(20).toArray()),
    playerLicensesCollection().then((c) => c.find({ discordId }).toArray()),
    playerWeaponsCollection().then((c) => c.find({ ownerId: discordId }).toArray()),
    playerPropertiesCollection().then((c) => c.find({ ownerId: discordId }).toArray()),
    playerVehiclesCollection().then((c) => c.find({ ownerId: discordId }).toArray()),
    marketplacePurchasesCollection().then((c) => c.find({ buyerId: discordId }).sort({ createdAt: -1 }).limit(30).toArray()),
    marketplacePurchasesCollection().then((c) => c.find({ sellerId: discordId }).sort({ createdAt: -1 }).limit(30).toArray()),
    socialProfilesCollection().then((c) => c.findOne({ discordId })),
    socialProfileStats(discordId).catch(() => null),
    careerProfilesCollection().then((c) => c.findOne({ discordId })),
    careerApplicationsCollection().then((c) => c.find({ applicantId: discordId }).sort({ createdAt: -1 }).limit(20).toArray()),
    careerCompaniesCollection().then((c) => c.find({ ownerId: discordId }).toArray()),
    vpsSubscriptionsCollection().then((c) => c.find({ discordId }).sort({ purchasedAt: -1 }).limit(10).toArray()),
    playerDeepWebItemsCollection().then((c) => c.find({ ownerId: discordId }).toArray()),
    deepWebStateCollection().then((c) => c.findOne({ discordId })),
    casinoBetsCollection().then((c) => c.find({ playerId: discordId }).sort({ createdAt: -1 }).limit(30).toArray()),
    staffSanctions().then((c) => c.find({ targetDiscordId: discordId }).sort({ createdAt: -1 }).toArray()),
    staffReports().then((c) => c.find({ reporterId: discordId }).sort({ createdAt: -1 }).limit(30).toArray()),
    staffTickets().then((c) => c.find({ playerId: discordId }).sort({ updatedAt: -1 }).limit(30).toArray()),
    staffAudit().then((c) => c.find({ targetId: discordId }).sort({ createdAt: -1 }).limit(50).toArray()),
    osUserPreferencesCollection().then((c) => c.findOne({ discordId })),
    db.collection('referral_codes').findOne({ userId: discordId }),
    db.collection('referrals').find({ userId: discordId }).sort({ createdAt: -1 }).toArray(),
    db.collection('referrals').find({ referredUserId: discordId }).toArray(),
  ]);

  if (!user) return null;

  const identity = await resolvePlayerIdentity(discordId, { username: user.username, displayName: user.global_name || user.username, avatar: user.avatar });

  return {
    discordId,
    identity,
    account: {
      username: user.username, globalName: user.global_name, avatar: user.avatar,
      createdAt: user.createdAt, lastLogin: user.lastLogin,
      membership: user.membership || null, whitelistFast: user.whitelistFast || null,
    },
    whitelist: whitelist ? {
      status: whitelist.status, currentPhase: whitelist.currentPhase, memberNumber: whitelist.memberNumber,
      roblox: whitelist.roblox || null, character: whitelist.character || null, document: whitelist.document || null,
      submittedAt: whitelist.submittedAt, reviewedAt: whitelist.reviewedAt, reviewedBy: whitelist.reviewedBy, staffNotes: whitelist.staffNotes,
    } : null,
    economy: {
      hubCoins: user.hubCoins || 0, hubCoinsTransactions: stripIds(hubCoinsTx as any[]),
      hubPayBalance: user.hubPayBalance || 0, hubPayFrozen: Boolean(user.hubPayFrozen), hubPayFrozenReason: user.hubPayFrozenReason || null,
      hubPayTransactions: stripIds(hubPayTx as any[]), hubPayPockets: stripIds(hubPayPockets as any[]),
      hubPayCards: stripIds(hubPayCards as any[]), hubPayAccounts: stripIds(hubPayAccounts as any[]),
    },
    crypto: cryptoWallet ? {
      holdings: cryptoSummary?.holdings || [], totalCOP: cryptoSummary?.totalCOP || 0,
      pinEnabled: Boolean(cryptoWallet.pinEnabled), transactions: stripIds(cryptoTx as any[]),
    } : null,
    inventory: {
      weapons: stripIds(weapons as any[]), licenses: stripIds(licenses as any[]),
      hiddenCount: hiddenItems.length, transfersOut: stripIds(transfersOut as any[]), transfersIn: stripIds(transfersIn as any[]),
    },
    properties: stripIds(properties as any[]),
    vehicles: stripIds(vehicles as any[]),
    purchases: { asBuyer: stripIds(purchasesAsBuyer as any[]), asSeller: stripIds(purchasesAsSeller as any[]) },
    hubSocial: socialProfile ? { profile: (({ _id, ...rest }) => rest)(socialProfile as any), stats: socialStats } : null,
    hubCareer: careerProfile ? {
      profile: (({ _id, ...rest }) => rest)(careerProfile as any),
      applications: stripIds(careerApplications as any[]), companiesOwned: stripIds(careerCompanies as any[]),
    } : null,
    vps: stripIds(vpsSubs as any[]),
    deepWeb: {
      items: stripIds(deepWebItems as any[]),
      exposure: deepWebState ? { value: deepWebState.exposure, tier: exposureTier(deepWebState.exposure), sessionActive: deepWebState.sessionActive, vpsProtected: deepWebState.vpsProtected } : null,
    },
    casino: stripIds(casinoBets as any[]),
    administrative: {
      sanctions: stripIds(sanctions as any[]),
      activeSanctions: sanctions.filter((s: any) => s.active).length,
      reportsMade: stripIds(reportsMade as any[]),
      reportsMadeNote: 'Los reportes en contra de un jugador solo se registran como texto libre (targetName), no se pueden vincular por ID de forma confiable.',
      tickets: stripIds(tickets as any[]),
      auditEntries: stripIds(auditEntries as any[]),
      auditNote: 'El log de auditoría no vincula targetId en todas las acciones — esta lista puede estar incompleta.',
    },
    system: {
      preferences: osPreferences ? (({ _id, ...rest }) => rest)(osPreferences as any) : null,
    },
    referrals: {
      ownCode: referralCode ? (({ _id, ...rest }) => rest)(referralCode as any) : null,
      made: stripIds(referralsMade as any[]),
      referredBy: stripIds(referredBy as any[]),
    },
  };
}

export type PlayerDossier = NonNullable<Awaited<ReturnType<typeof getPlayerDossier>>>;
