export interface SocialComment {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  /** Comentario al que responde, para hilos de un nivel. Ausente = comentario de primer nivel. */
  parentCommentId?: string;
  createdAt: Date;
}

export type SocialReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad';

export interface SocialReaction {
  discordId: string;
  type: SocialReactionType;
}

export interface SocialPost {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  avatar?: string;
  text: string;
  imageUrl?: string;
  /** Si está seteado, el post se muestra con la identidad de la página (nombre/avatar
   * denormalizados en `username`/`displayName`/`avatar` al crearlo), no la del usuario que
   * publicó — `discordId` sigue siendo quien lo publicó, para saber quién puede borrarlo. */
  authorPageId?: string;
  /** Si está seteado, el post pertenece al feed de este grupo (se sigue publicando con la
   * identidad del usuario, a diferencia de `authorPageId`). */
  groupId?: string;
  /** @deprecated reemplazado por `reactions` — se sigue leyendo para posts creados antes de
   * las multi-reacciones (se tratan como reacciones tipo "like"), pero ya no se escribe. */
  likes: string[];
  reactions?: SocialReaction[];
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
  /** Sufijo corto junto al nombre, tipo cargo/título (ej: "CEO of ERLCᴴᵁᴮ"). */
  title?: string;
  website?: string;
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
