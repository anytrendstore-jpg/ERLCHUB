export interface ServerJoin {
  serverId: string;
  serverName: string;
  joinedAt: Date;
  isActive: boolean;
}

export interface UserServerData {
  discordId: string;
  serverJoins: {
    erlchub?: ServerJoin;
    losSantos?: ServerJoin; 
  
  };
  currentCity?: {
    id: string;
    name: string;
    joinedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const SERVER_IDS = {
  ERLCHUB: '1142277873915400222',
  LOS_SANTOS: '1432194616224120916'
} as const;

export const SERVER_NAMES = {
  [SERVER_IDS.ERLCHUB]: 'ERLCHub',
  [SERVER_IDS.LOS_SANTOS]: 'Los Santos'
} as const;

export const CITY_NAMES = {
  [SERVER_IDS.LOS_SANTOS]: 'Los Santos'
} as const;