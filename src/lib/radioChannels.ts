export interface RadioChannel {
  id: string;
  name: string;
  frequency: string;
}

/** Canales fijos del servidor. Cambiar de canal = cambiar de frecuencia. */
export const RADIO_CHANNELS: RadioChannel[] = [
  { id: 'civil', name: 'Civil', frequency: '100.0' },
  { id: 'police-1', name: 'Policía 1', frequency: '155.4' },
  { id: 'police-2', name: 'Policía 2 (Táctico)', frequency: '155.9' },
  { id: 'fire', name: 'Bomberos', frequency: '167.2' },
  { id: 'ems', name: 'Paramédicos', frequency: '172.6' },
  { id: 'dot', name: 'DOTS', frequency: '180.1' },
  { id: 'gang', name: 'Privado 1', frequency: '410.5' },
];

export function radioChannelById(id: string): RadioChannel | undefined {
  return RADIO_CHANNELS.find((c) => c.id === id);
}
