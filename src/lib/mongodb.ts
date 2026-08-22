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
