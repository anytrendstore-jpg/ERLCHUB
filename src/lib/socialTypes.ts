export interface SocialComment {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  createdAt: Date;
}

export interface SocialPost {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: SocialComment[];
  shares: string[];
  savedBy: string[];
  viewedBy: string[];
  editedAt?: Date;
  featured?: boolean;
  removedByStaff?: boolean;
  removedReason?: string;
  createdAt: Date;
}

export type SocialAccountType = 'personal' | 'business' | 'organization';

export interface SocialProfile {
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  verified?: boolean;
  accountType?: SocialAccountType;
  suspended?: boolean;
  suspendedReason?: string;
  updatedAt: Date;
}

export type SocialReportTargetType = 'post' | 'comment' | 'user';
export type SocialReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface SocialReport {
  id: string;
  targetType: SocialReportTargetType;
  targetId: string;
  /** Para reportes de comentario, el post al que pertenece (para poder localizarlo). */
  postId?: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  status: SocialReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface SocialStory {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  type: 'image' | 'text';
  content: string;
  backgroundColor?: string;
  viewedBy: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface SocialFollow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}
