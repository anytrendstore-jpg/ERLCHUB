import type { OfficerRank } from '@/lib/mdtTypes';

/**
 * Mismo orden jerárquico que ya usa `hasPermission` en MDTContext.tsx —
 * acá simplemente se numera para poder comparar contra el `minLevel` de
 * cada módulo del directorio institucional.
 */
export const OFFICER_RANK_LEVEL: Record<OfficerRank, number> = {
  Officer: 1,
  Sergeant: 2,
  Lieutenant: 3,
  Captain: 4,
  Chief: 5,
};

export function clearanceLevel(rank: OfficerRank | undefined | null): number {
  if (!rank) return 0;
  return OFFICER_RANK_LEVEL[rank] ?? 0;
}
