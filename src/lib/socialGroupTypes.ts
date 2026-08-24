export type SocialGroupPrivacy = 'public' | 'private';
export type SocialGroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type SocialGroupMemberStatus = 'active' | 'pending';

export interface SocialGroup {
  id: string;
  name: string;
  description?: string;
  category?: string;
  coverImage?: string;
  icon?: string;
  privacy: SocialGroupPrivacy;
  ownerId: string;
  createdAt: Date;
}

export interface SocialGroupMember {
  groupId: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: SocialGroupRole;
  status: SocialGroupMemberStatus;
  joinedAt: Date;
}
