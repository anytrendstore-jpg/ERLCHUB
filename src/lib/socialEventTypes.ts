export type SocialEventOrganizerType = 'user' | 'page' | 'group';
export type SocialEventRsvpStatus = 'interested' | 'attending' | 'not_attending';

export interface SocialEvent {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  /** Fecha en formato ISO (YYYY-MM-DD). */
  date: string;
  time?: string;
  location: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  organizerType: SocialEventOrganizerType;
  groupId?: string;
  pageId?: string;
  interested: string[];
  attending: string[];
  notAttending: string[];
  createdAt: Date;
}
