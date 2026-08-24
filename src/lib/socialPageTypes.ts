/** 'official' es exclusivo de la(s) cuenta(s) del propio ERLCHUB — se distingue
 * visualmente de una organización/empresa/gobierno verificada cualquiera. */
export type SocialPageVerificationType = 'business' | 'organization' | 'government' | 'official';

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
  ownerId: string;
  admins: string[];
  followers: string[];
  createdAt: Date;
}
