/** 'official' es exclusivo de la(s) cuenta(s) del propio ERLCHUB — se distingue
 * visualmente de una organización/empresa/gobierno verificada cualquiera. */
export type SocialPageVerificationType = 'business' | 'organization' | 'government' | 'official';

/** Prioridad de aparición para páginas destacadas/sugeridas: 'official' (ERLCHUB) siempre
 * primero, luego gobierno, luego el resto — antes de ordenar por popularidad. */
export function pageVerificationPriority(type: SocialPageVerificationType | undefined): number {
  if (type === 'official') return 3;
  if (type === 'government') return 2;
  if (type === 'organization' || type === 'business') return 1;
  return 0;
}

export interface SocialPageLink {
  label: string;
  url: string;
}

export interface SocialPage {
  id: string;
  name: string;
  category: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  verified: boolean;
  verificationType?: SocialPageVerificationType;
  /** Botones anclados de accesos directos debajo del header de la página (ej: Tienda, Instagram, Soporte). */
  pinnedLinks?: SocialPageLink[];
  ownerId: string;
  admins: string[];
  followers: string[];
  createdAt: Date;
}
