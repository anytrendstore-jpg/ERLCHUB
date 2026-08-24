export type SocialPageVerificationType = 'business' | 'organization' | 'government';

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
