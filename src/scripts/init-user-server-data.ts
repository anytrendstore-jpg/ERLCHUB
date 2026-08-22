import { connectToDatabase } from '@/lib/mongodb';
import { SERVER_IDS, SERVER_NAMES, CITY_NAMES } from '@/models/UserServerData';

async function initUserServerData(userId: string) { 
  try {
    const db = await connectToDatabase();
    
    const discordId = userId; 
    const existingData = await db.collection('userServerData').findOne({ discordId });
    if (existingData) return existingData;

    const user = await db.collection('users').findOne({ discordId });
    const now = new Date();
    const joinedDate = user?.createdAt ? new Date(user.createdAt) : now;

    const serverData = {
      discordId,
      serverJoins: {
        erlchub: {
          serverId: SERVER_IDS.ERLCHUB,
          serverName: SERVER_NAMES[SERVER_IDS.ERLCHUB],
          joinedAt: joinedDate, 
          isActive: true
        },
        losSantos: {
          serverId: SERVER_IDS.LOS_SANTOS,
          serverName: SERVER_NAMES[SERVER_IDS.LOS_SANTOS],
          joinedAt: now, 
          isActive: true
        }
      },
      currentCity: {
        id: SERVER_IDS.LOS_SANTOS,
        name: CITY_NAMES[SERVER_IDS.LOS_SANTOS],
        joinedAt: now
      },
      createdAt: now,
      updatedAt: now
    };

    await db.collection('userServerData').insertOne(serverData);
    return serverData;
  } catch (error) {
    console.error('Error auto-inicializando:', error);
  }
}

export { initUserServerData };