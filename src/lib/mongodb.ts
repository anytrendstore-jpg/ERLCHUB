import dns from 'dns';
import { MongoClient, type Db } from 'mongodb';

// En esta máquina, Node resuelve su lista de servidores DNS a 127.0.0.1 (nada escucha
// ahí), lo que rompe las consultas SRV/A que usa el driver de Mongo con "mongodb+srv://"
// aunque el sistema operativo sí resuelve bien esos mismos hosts. Forzamos servidores
// DNS públicos para las resoluciones de este proceso Node de forma incondicional: el
// valor por defecto de Node en esta máquina es poco fiable incluso entre requests.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI!;
const options = {};

// La conexión se crea de forma perezosa y se reintenta si falla: si el servidor
// de Mongo todavía no está levantado cuando arranca Next, la siguiente llamada
// vuelve a intentarlo en lugar de quedarse con una promesa rechazada para siempre.
let clientPromise: Promise<MongoClient> | null = null;

function connect(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI no está definida'));
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, options).connect().catch((error) => {
      clientPromise = null; // permite reintentar en la siguiente petición
      throw error;
    });
  }
  return clientPromise;
}

export async function connectToDatabase(): Promise<Db> {
  const connectedClient = await connect();
  return connectedClient.db();
}

/** Para operaciones que necesitan session.startSession() (transacciones multi-documento) — connectToDatabase() solo da el Db, no el client. */
export async function getMongoClient(): Promise<MongoClient> {
  return connect();
}

let transactionSupport: boolean | null = null;

/**
 * Detecta una sola vez si el servidor soporta transacciones reales (replica set / mongos —
 * Atlas siempre; un mongod standalone local, no). Se cachea para el tiempo de vida del proceso:
 * el tipo de servidor no cambia en caliente. Usado por cashServer.ts/treasuryServer.ts para
 * envolver en session.withTransaction() cuando es posible, y degradar a escritura secuencial
 * (mismo patrón que ya usa el resto del código) cuando no — nunca para decidir SI hace falta
 * atomicidad, solo si el motor de abajo puede dársela de verdad.
 */
export async function supportsTransactions(): Promise<boolean> {
  if (transactionSupport !== null) return transactionSupport;
  const client = await connect();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await client.db().collection('_txn_probe').findOne({}, { session });
    });
    transactionSupport = true;
  } catch {
    transactionSupport = false;
  } finally {
    await session.endSession();
  }
  return transactionSupport;
}
