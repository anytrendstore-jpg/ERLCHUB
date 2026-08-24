import type {
  OSUser,
  OSApp,
  OSNotification,
  HubPayWallet,
  HubPayTransaction,
  HubPayPocket,
  HubPayAccount,
  HubPayCard,
  HubPayTax
} from './osTypes';

export const mockProfiles = [
  {
    id: 'profile_admin',
    type: 'admin' as const,
    displayName: 'Carlos Rodríguez',
    username: 'carlos_rp',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos_admin',
    role: 'admin' as const,
  },
  {
    id: 'profile_character',
    type: 'character' as const,
    displayName: 'Miguel Torres',
    username: 'miguel_t',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=miguel_character',
    role: 'user' as const,
    characterName: 'Miguel Torres',
    characterJob: 'Oficial de Policía',
  }
];

export const mockUser: OSUser = {
  id: 'usr_001',
  username: 'carlos_rp',
  displayName: 'Carlos Rodríguez',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos_admin',
  robloxId: '1234567890',
  discordId: '987654321',
  dni: 'ERLC-2024-00147',
  role: 'admin',
  createdAt: new Date('2024-01-15'),
  lastLogin: new Date(),
  profiles: mockProfiles,
  activeProfileId: 'profile_admin'
};

export const osApps: OSApp[] = [
  {
    id: 'hubstore',
    name: 'Hub Store',
    icon: 'hubstore',
    component: 'HubStoreApp',
    isLocked: false,
    requiresStaff: false,
    category: 'system',
    description: 'Descubre e instala nuevas aplicaciones'
  },
  {
    id: 'hubpay',
    name: 'HubPay',
    icon: 'hubpay',
    component: 'HubPayApp',
    isLocked: false,
    requiresStaff: false,
    category: 'finance',
    description: 'Tu billetera virtual'
  },
  {
    id: 'hubchat',
    name: 'HubChat',
    icon: 'hubchat',
    component: 'HubChatApp',
    isLocked: false,
    requiresStaff: false,
    category: 'social',
    description: 'Mensajería del servidor'
  },
  {
    id: 'emergency911',
    name: '911',
    icon: 'emergency911',
    component: 'Emergency911App',
    isLocked: false,
    requiresStaff: false,
    category: 'roleplay',
    description: 'Reporta emergencias a Policía, Sheriff y Bomberos'
  },
  {
    id: 'amazon',
    name: 'MercadoLibre',
    icon: 'amazon',
    component: 'AmazonApp',
    isLocked: false,
    requiresStaff: false,
    category: 'market',
    description: 'Compra, vende y publica artículos'
  },
  {
    id: 'socialhub',
    name: 'HubSocial',
    icon: 'socialhub',
    component: 'SocialHubApp',
    isLocked: false,
    requiresStaff: false,
    category: 'social',
    description: 'La red social del servidor'
  },
  {
    id: 'hubcareer',
    name: 'HubCareer',
    icon: 'hubcareer',
    component: 'HubCareerApp',
    isLocked: false,
    requiresStaff: false,
    category: 'roleplay',
    description: 'Red profesional: perfil, empresas y empleos'
  },
  {
    id: 'deepweb',
    name: 'Onion',
    icon: 'deepweb',
    component: 'DeepWebApp',
    isLocked: false,
    requiresStaff: false,
    category: 'market',
    description: 'Mercado alternativo'
  },
  {
    id: 'vps',
    name: 'VPS Manager',
    icon: 'vps',
    component: 'VPSManagerApp',
    isLocked: false,
    requiresStaff: false,
    category: 'system',
    description: 'Suscripción de protección premium para la Deep Web'
  },
  {
    id: 'crypto',
    name: 'Crypto Wallet',
    icon: 'crypto',
    component: 'CryptoWalletApp',
    isLocked: false,
    requiresStaff: false,
    category: 'finance',
    description: 'Billetera de criptomonedas del servidor'
  },
  {
    id: 'dealer',
    name: 'Motors',
    icon: 'dealer',
    component: 'DealerApp',
    isLocked: false,
    requiresStaff: false,
    category: 'market',
    description: 'Concesionario de vehículos'
  },
  {
    id: 'marketplace',
    name: 'Ammu-Nation',
    icon: 'marketplace',
    component: 'AmmuNationApp',
    isLocked: false,
    requiresStaff: false,
    category: 'market',
    description: 'Armas, munición y accesorios'
  },
  {
    id: 'realestate',
    name: 'Properties',
    icon: 'realestate',
    component: 'RealEstateApp',
    isLocked: false,
    requiresStaff: false,
    category: 'market',
    description: 'Compra y administra propiedades'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: 'jobs',
    component: 'JobsApp',
    isLocked: true,
    requiresStaff: false,
    category: 'roleplay',
    description: 'Sistema de empleos',
    comingSoon: true
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'business',
    component: 'BusinessApp',
    isLocked: true,
    requiresStaff: false,
    category: 'roleplay',
    description: 'Crea tu empresa',
    comingSoon: true
  },
  {
    id: 'casino',
    name: 'Casino',
    icon: 'casino',
    component: 'CasinoApp',
    isLocked: false,
    requiresStaff: false,
    category: 'market',
    description: 'Ruleta, dados y tragamonedas'
  },
  {
    id: 'browser',
    name: 'Google',
    icon: 'browser',
    component: 'GoogleBrowserApp',
    isLocked: false,
    requiresStaff: false,
    category: 'system',
    description: 'Navegador web interno'
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    component: 'SettingsApp',
    isLocked: false,
    requiresStaff: false,
    category: 'system',
    description: 'Ajustes del sistema'
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: 'profile',
    component: 'ProfileApp',
    isLocked: false,
    requiresStaff: false,
    category: 'system',
    description: 'Tu información'
  },
  {
    id: 'archivos',
    name: 'Archivos',
    icon: 'archivos',
    component: 'ArchivosApp',
    isLocked: false,
    requiresStaff: false,
    category: 'system',
    description: 'El inventario de tu personaje'
  }
];

export const mockNotifications: OSNotification[] = [
  {
    id: 'not_001',
    title: 'Bienvenido a ERLC HUB OS',
    message: 'Tu cuenta ha sido verificada exitosamente.',
    type: 'success',
    timestamp: new Date(),
    read: false
  },
  {
    id: 'not_002',
    title: 'HubPay',
    message: 'Has recibido $5,000 de @maria_rp',
    type: 'info',
    appId: 'hubpay',
    timestamp: new Date(Date.now() - 3600000),
    read: false
  },
  {
    id: 'not_003',
    title: 'Impuestos',
    message: 'Se ha aplicado retención del 5% a tu último ingreso.',
    type: 'warning',
    appId: 'hubpay',
    timestamp: new Date(Date.now() - 7200000),
    read: true
  }
];

export const mockTransactions: HubPayTransaction[] = [
  {
    id: 'txn_001',
    type: 'income',
    amount: 15000,
    description: 'Salario - Policía ERLC',
    timestamp: new Date(Date.now() - 86400000),
    status: 'completed',
    category: 'Salario'
  },
  {
    id: 'txn_002',
    type: 'transfer',
    amount: 5000,
    description: 'Transferencia recibida',
    fromUser: 'maria_rp',
    timestamp: new Date(Date.now() - 3600000),
    status: 'completed',
    category: 'Transferencia'
  },
  {
    id: 'txn_003',
    type: 'expense',
    amount: 2500,
    description: 'Compra en Tienda Central',
    timestamp: new Date(Date.now() - 7200000),
    status: 'completed',
    category: 'Compras'
  },
  {
    id: 'txn_004',
    type: 'tax',
    amount: 750,
    description: 'Impuesto sobre ingreso (5%)',
    timestamp: new Date(Date.now() - 86400000),
    status: 'completed',
    category: 'Impuestos'
  },
  {
    id: 'txn_005',
    type: 'transfer',
    amount: 3000,
    description: 'Pago a @juan_rp',
    toUser: 'juan_rp',
    timestamp: new Date(Date.now() - 172800000),
    status: 'completed',
    category: 'Transferencia'
  },
  {
    id: 'txn_006',
    type: 'salary',
    amount: 12000,
    description: 'Salario semanal',
    timestamp: new Date(Date.now() - 604800000),
    status: 'completed',
    category: 'Salario'
  },
  {
    id: 'txn_007',
    type: 'withdrawal',
    amount: 8000,
    description: 'Retiro a cuenta bancaria',
    timestamp: new Date(Date.now() - 259200000),
    status: 'pending',
    category: 'Retiro'
  }
];

export const mockPockets: HubPayPocket[] = [
  {
    id: 'pkt_001',
    name: 'Ahorro Emergencia',
    balance: 25000,
    icon: 'shield',
    color: '#3b82f6',
    isLocked: true,
    goal: 50000
  },
  {
    id: 'pkt_002',
    name: 'Vehículo Nuevo',
    balance: 45000,
    icon: 'car',
    color: '#10b981',
    isLocked: false,
    goal: 150000
  },
  {
    id: 'pkt_003',
    name: 'Casa',
    balance: 80000,
    icon: 'home',
    color: '#f59e0b',
    isLocked: true,
    goal: 500000
  }
];

export const mockAccounts: HubPayAccount[] = [
  {
    id: 'acc_001',
    accountNumber: 'ERLC-8847-2024-0147',
    type: 'savings',
    status: 'active',
    balance: 67500,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'acc_002',
    accountNumber: 'ERLC-8847-2024-0148',
    type: 'checking',
    status: 'active',
    balance: 12300,
    createdAt: new Date('2024-02-20')
  }
];

export const mockCards: HubPayCard[] = [
  {
    id: 'crd_001',
    cardNumber: '4847 2584 9631 7452',
    type: 'debit',
    expiryDate: '12/28',
    cvv: '847',
    status: 'active',
    lastFourDigits: '7452',
    cardHolder: 'CARLOS RODRIGUEZ',
    color: 'gradient'
  }
];

export const mockTaxes: HubPayTax[] = [
  {
    id: 'tax_001',
    type: 'income',
    percentage: 5,
    amount: 750,
    appliedTo: 'Salario - Policía ERLC',
    timestamp: new Date(Date.now() - 86400000)
  },
  {
    id: 'tax_002',
    type: 'income',
    percentage: 5,
    amount: 600,
    appliedTo: 'Salario semanal',
    timestamp: new Date(Date.now() - 604800000)
  },
  {
    id: 'tax_003',
    type: 'sales',
    percentage: 8,
    amount: 200,
    appliedTo: 'Venta en Marketplace',
    timestamp: new Date(Date.now() - 432000000)
  }
];

export const mockWallet: HubPayWallet = {
  availableBalance: 67500,
  retainedBalance: 8000,
  totalBalance: 75500,
  pockets: mockPockets,
  accounts: mockAccounts,
  cards: mockCards,
  transactions: mockTransactions,
  taxes: mockTaxes
};