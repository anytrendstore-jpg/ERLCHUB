export type ProfileType = 'admin' | 'character';

export interface OSProfile {
  id: string;
  type: ProfileType;
  displayName: string;
  username: string;
  avatar: string;
  role: 'user' | 'staff' | 'admin' | 'owner';
  characterName?: string;
  characterJob?: string;
}

export interface OSUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  robloxId?: string;
  robloxUsername?: string;
  robloxVerified?: boolean;
  discordId: string;
  dni?: string;
  role: 'user' | 'staff' | 'admin' | 'owner';
  createdAt: Date;
  lastLogin: Date;
  profiles: OSProfile[];
  activeProfileId: string;
}

export interface OSApp {
  id: string;
  name: string;
  icon: string;
  component: string;
  isLocked: boolean;
  requiresStaff: boolean;
  category: 'finance' | 'roleplay' | 'social' | 'system' | 'market' | 'police';
  description: string;
  comingSoon?: boolean;
}

export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export type WallpaperFit = 'fill' | 'fit' | 'stretch' | 'center' | 'tile';

export type DesktopIconSize = 'small' | 'medium' | 'large';

export interface OSTheme {
  mode: 'dark' | 'light';
  accent: string;
  taskbar: string;
  startMenu: string;
  windowBorder: string;
  selection: string;
  transparency: number;
  iconSize: DesktopIconSize;
  taskbarIconSize: DesktopIconSize;
}

export interface OSWallpaper {
  type: 'preset' | 'custom';
  value: string;
  fit: WallpaperFit;
}

export interface OSSavedTheme {
  id: string;
  name: string;
  theme: OSTheme;
  wallpaper: OSWallpaper;
}

export interface OSOnboardingState {
  completed: boolean;
  completedAt?: Date;
  tutorialVersion?: string;
}

export interface OSUserPreferences {
  discordId: string;
  wallpaper: OSWallpaper;
  theme: OSTheme;
  savedThemes: OSSavedTheme[];
  installedApps: string[];
  pinnedApps: string[];
  onboarding: OSOnboardingState;
  updatedAt: Date;
}

export interface OSModuleConfig {
  id: string;
  enabled: boolean;
  requiresStaff: boolean;
  name?: string;
  description?: string;
  extra?: Record<string, unknown>;
  updatedAt: Date;
  updatedBy: string;
}

export interface OSNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  appId?: string;
  timestamp: Date;
  read: boolean;
}

export interface HubPayAccount {
  id: string;
  accountNumber: string;
  type: 'savings' | 'checking' | 'business';
  status: 'active' | 'pending' | 'frozen';
  balance: number;
  createdAt: Date;
}

export interface HubPayCard {
  id: string;
  cardNumber: string;
  type: 'debit' | 'credit';
  expiryDate: string;
  cvv: string;
  status: 'active' | 'frozen' | 'cancelled';
  lastFourDigits: string;
  cardHolder: string;
  color: 'blue' | 'black' | 'gradient';
}

export interface HubPayTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'tax' | 'salary' | 'withdrawal';
  amount: number;
  description: string;
  fromUser?: string;
  toUser?: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  category: string;
}

export interface HubPayPocket {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  isLocked: boolean;
  goal?: number;
}

export interface HubPayWithdrawal {
  id: string;
  amount: number;
  method: 'bank' | 'crypto' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface HubPayTax {
  id: string;
  type: 'income' | 'sales' | 'property' | 'business';
  percentage: number;
  amount: number;
  appliedTo: string;
  timestamp: Date;
}

export interface HubPayWallet {
  availableBalance: number;
  hubCoinsBalance: number;
  retainedBalance: number;
  totalBalance: number;
  frozen?: boolean;
  frozenReason?: string;
  pockets: HubPayPocket[];
  accounts: HubPayAccount[];
  cards: HubPayCard[];
  transactions: HubPayTransaction[];
  taxes: HubPayTax[];
}