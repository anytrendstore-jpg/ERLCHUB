'use client';

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  active?: boolean;
}

// HubPay - Icono de billetera/banco moderno
export const HubPayIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="hubpay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect x="2" y="5" width="20" height="14" rx="3" fill="url(#hubpay-grad)" />
    <rect x="2" y="9" width="20" height="3" fill="#1E3A8A" opacity="0.5" />
    <circle cx="17" cy="15" r="2" fill="#FCD34D" />
    <circle cx="14" cy="15" r="2" fill="#F59E0B" />
  </svg>
);

// VPS Manager - Icono de servidor/escudo
export const VPSIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="vps-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="6" rx="2" fill="url(#vps-grad)" />
    <rect x="3" y="10.5" width="18" height="6" rx="2" fill="url(#vps-grad)" opacity="0.8" />
    <circle cx="6.5" cy="6" r="1" fill="#083344" />
    <circle cx="6.5" cy="13.5" r="1" fill="#083344" />
    <path d="M8 19.5L12 22L16 19.5V17H8V19.5Z" fill="#67E8F9" opacity="0.9" />
  </svg>
);

// Crypto Wallet - Icono de moneda digital
export const CryptoIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="crypto-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#crypto-grad)" />
    <path d="M12 6.5V17.5M9.2 8.7h4.1a1.9 1.9 0 010 3.8H9.2m0 0h4.6a2.1 2.1 0 010 4.2H9.2" stroke="#F5F3FF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// HubCareer - Icono de maletín profesional
export const HubCareerIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="career-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    <rect x="3" y="8" width="18" height="12" rx="2.5" fill="url(#career-grad)" />
    <path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" stroke="#0C4A6E" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="12" width="18" height="3" fill="#0C4A6E" opacity="0.5" />
  </svg>
);

// Store - Icono de bolsa de compras moderna
export const StoreIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="store-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <path d="M6 6L4 10V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V10L18 6H6Z" fill="url(#store-grad)" />
    <path d="M4 10H20" stroke="#92400E" strokeWidth="1.5" />
    <path d="M9 6V3H15V6" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="15" r="2" fill="white" opacity="0.9" />
  </svg>
);

// Onion/DeepWeb - Icono de cebolla estilizada
export const OnionIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="onion-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
    </defs>
    <ellipse cx="12" cy="14" rx="8" ry="7" fill="url(#onion-grad)" />
    <ellipse cx="12" cy="14" rx="5" ry="4.5" fill="#5B21B6" />
    <ellipse cx="12" cy="14" rx="2.5" ry="2" fill="#4C1D95" />
    <path d="M12 3C12 3 14 6 14 8C14 10 12 11 12 11C12 11 10 10 10 8C10 6 12 3 12 3Z" fill="#22C55E" />
  </svg>
);

// Motors - Icono de coche deportivo
export const MotorsIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="motors-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
    <path d="M5 13L6 9H9L11 7H15L17 9H20L21 13H5Z" fill="url(#motors-grad)" />
    <rect x="3" y="13" width="18" height="4" rx="1" fill="#991B1B" />
    <circle cx="7" cy="17" r="2" fill="#374151" />
    <circle cx="7" cy="17" r="1" fill="#6B7280" />
    <circle cx="17" cy="17" r="2" fill="#374151" />
    <circle cx="17" cy="17" r="1" fill="#6B7280" />
    <rect x="9" y="10" width="3" height="2" rx="0.5" fill="#93C5FD" opacity="0.8" />
    <rect x="13" y="10" width="3" height="2" rx="0.5" fill="#93C5FD" opacity="0.8" />
  </svg>
);

// Market - Icono de etiqueta de precio
export const MarketIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="market-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="url(#market-grad)" />
    <path d="M12 2L21 7L12 12L3 7L12 2Z" fill="#34D399" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">$</text>
  </svg>
);

// Properties - Icono de casa moderna
export const PropertiesIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="prop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    <path d="M12 3L2 10H5V20H19V10H22L12 3Z" fill="url(#prop-grad)" />
    <rect x="10" y="13" width="4" height="7" fill="#0E7490" />
    <rect x="7" y="11" width="3" height="3" fill="#22D3EE" opacity="0.8" />
    <rect x="14" y="11" width="3" height="3" fill="#22D3EE" opacity="0.8" />
  </svg>
);

// Jobs - Icono de maletín
export const JobsIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="jobs-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <rect x="3" y="8" width="18" height="12" rx="2" fill="url(#jobs-grad)" />
    <path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" stroke="#4C1D95" strokeWidth="2" />
    <rect x="3" y="12" width="18" height="2" fill="#5B21B6" />
    <rect x="10" y="11" width="4" height="4" rx="1" fill="#C4B5FD" />
  </svg>
);

// Business - Icono de gráfico/tendencia
export const BusinessIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="biz-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#16A34A" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#1F2937" />
    <rect x="5" y="14" width="3" height="5" rx="1" fill="url(#biz-grad)" />
    <rect x="10" y="10" width="3" height="9" rx="1" fill="url(#biz-grad)" />
    <rect x="15" y="6" width="3" height="13" rx="1" fill="url(#biz-grad)" />
    <path d="M5 12L10 8L14 10L19 5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="19" cy="5" r="1.5" fill="#4ADE80" />
  </svg>
);

// Radio - Icono de radio/walkie-talkie
export const RadioIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="radio-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    <rect x="5" y="7" width="14" height="15" rx="2" fill="url(#radio-grad)" />
    <rect x="7" y="10" width="10" height="6" rx="1" fill="#7C2D12" />
    <circle cx="12" cy="19" r="1.5" fill="#FED7AA" />
    <rect x="10" y="3" width="4" height="4" rx="1" fill="#9A3412" />
    <rect x="11" y="1" width="2" height="3" rx="1" fill="#FB923C" />
  </svg>
);

// SocialHub - Icono de red social (burbuja + corazón)
// Logo real de HubSocial (public/hubsocial.png): silueta blanca sobre fondo negro.
// El negro se vuelve transparente con mix-blend-mode "screen" sobre el degradé
// morado de la app, así queda como una marca blanca limpia sin editar el archivo.
export const SocialHubIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <div
    className={`relative overflow-hidden rounded-[22%] flex-shrink-0 transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
    style={{ width: size, height: size, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/hubsocial.png" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ mixBlendMode: 'screen' }} />
  </div>
);

// Casino - Icono de dados
export const CasinoIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="casino-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
    <rect x="3" y="9" width="10" height="10" rx="2" fill="url(#casino-grad)" transform="rotate(-8 8 14)" />
    <rect x="11" y="4" width="10" height="10" rx="2" fill="#c084fc" transform="rotate(8 16 9)" />
    <circle cx="15" cy="7" r="0.9" fill="#4c1d95" />
    <circle cx="19" cy="11" r="0.9" fill="#4c1d95" />
    <circle cx="6" cy="13" r="0.9" fill="white" />
    <circle cx="10" cy="17" r="0.9" fill="white" />
    <circle cx="6" cy="17" r="0.9" fill="white" />
    <circle cx="10" cy="13" r="0.9" fill="white" />
  </svg>
);

// Browser - Icono de navegador (globo)
export const BrowserIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="browser-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#34A853" />
        <stop offset="100%" stopColor="#FBBC05" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#browser-grad)" />
    <circle cx="12" cy="12" r="10" stroke="#EA4335" strokeWidth="2" fill="none" opacity="0.3" />
    <circle cx="12" cy="12" r="3.5" fill="white" />
    <circle cx="12" cy="12" r="1.8" fill="#4285F4" />
  </svg>
);

// Settings - Icono de engranaje
export const SettingsIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110 rotate-45' : 'hover:scale-105 hover:rotate-12'} ${className}`}
  >
    <defs>
      <linearGradient id="settings-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6B7280" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
    </defs>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="#9CA3AF" />
    <path fillRule="evenodd" clipRule="evenodd" d="M12 1L14.4 3.2L17.6 2.4L19.2 5.2L22 6.4L21.6 9.6L24 12L21.6 14.4L22 17.6L19.2 18.8L17.6 21.6L14.4 20.8L12 23L9.6 20.8L6.4 21.6L4.8 18.8L2 17.6L2.4 14.4L0 12L2.4 9.6L2 6.4L4.8 5.2L6.4 2.4L9.6 3.2L12 1Z" fill="url(#settings-grad)" />
    <circle cx="12" cy="12" r="4" fill="#D1D5DB" />
    <circle cx="12" cy="12" r="2" fill="#6B7280" />
  </svg>
);

// Profile - Icono de usuario
export const ProfileIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="profile-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#profile-grad)" />
    <circle cx="12" cy="9" r="3" fill="white" />
    <path d="M6 19C6 15.6863 8.68629 13 12 13C15.3137 13 18 15.6863 18 19" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Archivos - Icono de carpeta estilo Explorador de Windows
export const ArchivosIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="archivos-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <path d="M2 6.5C2 5.67157 2.67157 5 3.5 5H9L11 7.5H20.5C21.3284 7.5 22 8.17157 22 9V17.5C22 18.3284 21.3284 19 20.5 19H3.5C2.67157 19 2 18.3284 2 17.5V6.5Z" fill="url(#archivos-grad)" />
    <path d="M2 9C2 8.17157 2.67157 7.5 3.5 7.5H20.5C21.3284 7.5 22 8.17157 22 9V17.5C22 18.3284 21.3284 19 20.5 19H3.5C2.67157 19 2 18.3284 2 17.5V9Z" fill="#93C5FD" fillOpacity="0.85" />
  </svg>
);

// Pocket Icons - Para HubPayPockets
export const PocketMoneyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#22C55E" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">$</text>
  </svg>
);

export const PocketHomeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#F59E0B" />
    <path d="M12 6L5 11V18H9V14H15V18H19V11L12 6Z" fill="white" />
  </svg>
);

export const PocketCarIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#3B82F6" />
    <path d="M6 14L7 11H10L11.5 9H12.5L14 11H17L18 14H6Z" fill="white" />
    <circle cx="8" cy="15" r="1.5" fill="#1E40AF" />
    <circle cx="16" cy="15" r="1.5" fill="#1E40AF" />
  </svg>
);

export const PocketTravelIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#06B6D4" />
    <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="white" opacity="0.8" />
    <path d="M12 6L18 10V14L12 18L6 14V10L12 6Z" fill="white" />
  </svg>
);

export const PocketGameIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#8B5CF6" />
    <rect x="6" y="8" width="12" height="8" rx="2" fill="white" />
    <circle cx="9" cy="12" r="1.5" fill="#8B5CF6" />
    <rect x="14" y="10" width="3" height="1" rx="0.5" fill="#8B5CF6" />
    <rect x="14" y="13" width="3" height="1" rx="0.5" fill="#8B5CF6" />
  </svg>
);

export const PocketPhoneIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#EC4899" />
    <rect x="8" y="5" width="8" height="14" rx="2" fill="white" />
    <rect x="10" y="16" width="4" height="1" rx="0.5" fill="#EC4899" />
  </svg>
);

export const PocketWorkIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#64748B" />
    <rect x="5" y="9" width="14" height="10" rx="1" fill="white" />
    <path d="M9 9V7C9 6.44772 9.44772 6 10 6H14C14.5523 6 15 6.44772 15 7V9" stroke="white" strokeWidth="1.5" />
  </svg>
);

export const PocketShieldIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#EF4444" />
    <path d="M12 5L6 8V12C6 15.31 8.55 18.36 12 19C15.45 18.36 18 15.31 18 12V8L12 5Z" fill="white" />
    <path d="M11 13L9.5 11.5L8.5 12.5L11 15L16 10L15 9L11 13Z" fill="#EF4444" />
  </svg>
);

export const PocketTargetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#F97316" />
    <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="1" fill="white" />
  </svg>
);

export const PocketDiamondIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#7C3AED" />
    <path d="M12 5L6 10L12 19L18 10L12 5Z" fill="white" />
    <path d="M6 10H18L12 5L6 10Z" fill="#C4B5FD" />
  </svg>
);

// Product Icons for Amazon and DeepWeb
export const ProductRadioIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="6" width="16" height="12" rx="2" fill="#374151" />
    <rect x="6" y="8" width="6" height="6" rx="1" fill="#6B7280" />
    <circle cx="15" cy="14" r="2" fill="#9CA3AF" />
    <rect x="6" y="15" width="4" height="1" rx="0.5" fill="#4B5563" />
    <rect x="18" y="3" width="1" height="4" fill="#6B7280" />
  </svg>
);

export const ProductMedicalIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="6" width="18" height="14" rx="2" fill="#DC2626" />
    <rect x="10" y="9" width="4" height="8" fill="white" />
    <rect x="7" y="11" width="10" height="4" fill="white" />
  </svg>
);

export const ProductVestIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 4L4 8V20H20V8L18 4H6Z" fill="#1F2937" />
    <rect x="6" y="8" width="12" height="2" fill="#FCD34D" />
    <rect x="6" y="12" width="12" height="2" fill="#FCD34D" />
    <rect x="6" y="16" width="12" height="2" fill="#FCD34D" />
  </svg>
);

export const ProductLaptopIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="5" width="18" height="12" rx="2" fill="#374151" />
    <rect x="5" y="7" width="14" height="8" rx="1" fill="#60A5FA" />
    <path d="M2 17H22L20 20H4L2 17Z" fill="#4B5563" />
  </svg>
);

export const ProductToolsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#6B7280" stroke="#374151" strokeWidth="1" />
  </svg>
);

export const ProductCameraIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="7" width="20" height="13" rx="2" fill="#1F2937" />
    <circle cx="12" cy="13" r="4" fill="#374151" stroke="#6B7280" strokeWidth="2" />
    <circle cx="12" cy="13" r="2" fill="#60A5FA" />
    <rect x="15" y="4" width="4" height="3" rx="1" fill="#374151" />
  </svg>
);

export const ProductUniformIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3L8 5V8L4 10V20H20V10L16 8V5L12 3Z" fill="#1E40AF" />
    <path d="M12 3L10 4V7H14V4L12 3Z" fill="white" />
    <rect x="8" y="12" width="2" height="2" fill="#60A5FA" />
    <rect x="8" y="15" width="2" height="2" fill="#60A5FA" />
  </svg>
);

export const ProductGPSIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="10" r="8" fill="#22C55E" opacity="0.3" />
    <circle cx="12" cy="10" r="5" fill="#22C55E" opacity="0.5" />
    <circle cx="12" cy="10" r="2" fill="#22C55E" />
    <path d="M12 10V18" stroke="#22C55E" strokeWidth="2" />
    <circle cx="12" cy="20" r="2" fill="#16A34A" />
  </svg>
);

// DeepWeb specific icons
export const LockpickIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="10" width="10" height="8" rx="1" fill="#6B7280" />
    <circle cx="8" cy="14" r="2" fill="#374151" />
    <rect x="13" y="12" width="8" height="2" rx="1" fill="#9CA3AF" />
    <rect x="13" y="13" width="6" height="3" fill="#6B7280" />
  </svg>
);

export const ScannerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#1F2937" />
    <path d="M8 8V6H6V8" stroke="#22C55E" strokeWidth="1.5" />
    <path d="M16 8V6H18V8" stroke="#22C55E" strokeWidth="1.5" />
    <path d="M8 16V18H6V16" stroke="#22C55E" strokeWidth="1.5" />
    <path d="M16 16V18H18V16" stroke="#22C55E" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" stroke="#22C55E" strokeWidth="1.5" fill="none" />
  </svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#F5F5F4" />
    <rect x="6" y="4" width="8" height="2" rx="0.5" fill="#A8A29E" />
    <rect x="6" y="8" width="12" height="1" rx="0.5" fill="#D6D3D1" />
    <rect x="6" y="11" width="12" height="1" rx="0.5" fill="#D6D3D1" />
    <rect x="6" y="14" width="8" height="1" rx="0.5" fill="#D6D3D1" />
    <rect x="14" y="16" width="4" height="4" fill="#DC2626" />
  </svg>
);

export const MaskIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="13" rx="8" ry="6" fill="#F5F5F4" />
    <ellipse cx="8" cy="12" rx="2" ry="2.5" fill="#1F2937" />
    <ellipse cx="16" cy="12" rx="2" ry="2.5" fill="#1F2937" />
    <path d="M10 16C10 16 11 17 12 17C13 17 14 16 14 16" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="6" y="6" width="3" height="4" fill="#F59E0B" />
    <rect x="15" y="6" width="3" height="4" fill="#F59E0B" />
  </svg>
);

export const JammerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="8" width="12" height="10" rx="2" fill="#374151" />
    <rect x="10" y="4" width="4" height="4" fill="#6B7280" />
    <rect x="11" y="2" width="2" height="3" fill="#EF4444" />
    <circle cx="12" cy="13" r="3" fill="#1F2937" />
    <path d="M8 18V20" stroke="#6B7280" strokeWidth="1.5" />
    <path d="M16 18V20" stroke="#6B7280" strokeWidth="1.5" />
    <circle cx="12" cy="13" r="1" fill="#EF4444" className="animate-pulse" />
  </svg>
);

export const SprayIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="8" y="8" width="8" height="14" rx="2" fill="#6B7280" />
    <rect x="10" y="4" width="4" height="4" rx="1" fill="#9CA3AF" />
    <rect x="11" y="2" width="2" height="2" fill="#D1D5DB" />
    <circle cx="6" cy="4" r="1" fill="#22C55E" opacity="0.6" />
    <circle cx="4" cy="6" r="1" fill="#22C55E" opacity="0.4" />
    <circle cx="5" cy="8" r="0.5" fill="#22C55E" opacity="0.3" />
  </svg>
);

export const HackingIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="4" width="20" height="14" rx="2" fill="#1F2937" />
    <rect x="4" y="6" width="16" height="10" fill="#0F172A" />
    <text x="12" y="13" textAnchor="middle" fill="#22C55E" fontSize="6" fontFamily="monospace">{'>'}_</text>
    <rect x="6" y="18" width="12" height="2" rx="1" fill="#374151" />
  </svg>
);

export const FakeMoneyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#22C55E" />
    <rect x="4" y="8" width="16" height="8" rx="1" stroke="#16A34A" strokeWidth="1" fill="none" />
    <circle cx="12" cy="12" r="3" fill="#16A34A" />
    <text x="12" y="14" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">$</text>
    <path d="M2 10L4 12L2 14" stroke="#16A34A" strokeWidth="0.5" />
    <path d="M22 10L20 12L22 14" stroke="#16A34A" strokeWidth="0.5" />
  </svg>
);

// HubChat Icon - Messaging app
export const HubChatIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="hubchat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#25D366" />
        <stop offset="100%" stopColor="#128C7E" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="20" height="16" rx="4" fill="url(#hubchat-grad)" />
    <path d="M7 9H17M7 13H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="17" cy="13" r="2" fill="#25D366" stroke="white" strokeWidth="1.5" />
    <path d="M6 19L8 17H18C19.1046 17 20 16.1046 20 15V7" stroke="url(#hubchat-grad)" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

// MDT - Police Mobile Data Terminal Icon
export const MDTIcon: React.FC<IconProps> = ({ className = '', size = 24, active = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} ${className}`}
  >
    <defs>
      <linearGradient id="mdt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="14" rx="2" fill="url(#mdt-grad)" />
    <rect x="4" y="5" width="16" height="10" rx="1" fill="#1E3A8A" />
    <path d="M6 7H12M6 9H14M6 11H10" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="17" cy="9" r="1.5" fill="#EF4444" />
    <path d="M8 18L12 15L16 18" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="11" y="18" width="2" height="3" fill="#1E40AF" />
    <rect x="7" y="21" width="10" height="1" rx="0.5" fill="#1E40AF" />
  </svg>
);

// MercadoLibre Logo Icon (logotipo oficial)
export const AmazonLogoIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg height={size} width={size} viewBox="1338.7 1396.4 150.1 135.8" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="m1378.1 1504.2h1.4v28h-5.3v-24.6c0-.8 1.7-3.4 3.9-3.4zm29 6.2c-2.6 0-4.6 1.1-6 3.3v-9.5h-.6c-2.6 0-4 1.4-4.7 2.6v-.2 16.1c0 6.3 3.3 9.5 9.9 9.5 6.6-.1 9.8-3.7 9.8-10.7 0-7.3-2.8-10.9-8.4-11.1zm-1.6 17.2c-3 0-4.5-2.2-4.4-6.4.2-4.1 1.6-6.1 4.5-6.1s4.3 2 4.5 6.1c0 4.3-1.6 6.4-4.6 6.4zm13.1-6.4c.2-6.8 3.5-10.6 10.6-10.6h1.6v5.5h-2.5c-3 0-4.3 1.9-4.3 5v11h-5.4zm20.6 5.5c.9.8 2.1 1.2 3.7 1.2 1.1 0 2.1-.3 2.9-.9s1.3-1.2 1.5-1.8h5c-.8 2.5-2 4.2-3.7 5.3s-3.6 1.6-6 1.6c-1.6 0-3.1-.3-4.4-.8s-2.4-1.3-3.3-2.2c-.9-1-1.6-2.1-2.1-3.4s-.7-2.8-.7-4.4c0-1.5.3-3 .8-4.3s1.2-2.5 2.1-3.4c.9-1 2-1.7 3.3-2.3s2.7-.8 4.3-.8c1.7 0 3.3.3 4.6 1s2.4 1.6 3.2 2.7 1.4 2.4 1.8 3.9c.4 1.4.5 3 .4 4.6h-14.9c.2 1.9.7 3.2 1.5 4zm6.4-10.8c-.7-.7-1.7-1.1-3.1-1.1-.9 0-1.7.2-2.3.5s-1.1.7-1.4 1.1c-.4.5-.6.9-.8 1.4s-.2 1-.3 1.4h9.2c-.1-1.5-.6-2.6-1.3-3.3zm-60.4-11.7h5.3v4.8h-5.3zm0 7.2h5.3v20.7h-5.3zm96.7-18.3c-.9 1-2.1 1.6-3.6 1.6s-2.7-.6-3.6-1.6-1.2-2.7-1.2-4.7c0-2.1.4-3.6 1.2-4.6.9-1 2.1-1.6 3.6-1.6s2.7.6 3.6 1.6 1.2 2.7 1.2 4.6-.3 3.5-1.2 4.7zm4.2-12.4c-1.6-2.1-4.3-3.3-7.8-3.3-3.4 0-6.2 1-7.8 3.3-1.6 2.1-2.6 4.7-2.6 7.6 0 3 .9 5.6 2.6 7.6 1.6 2.1 4.3 3.2 7.8 3.2 3.4 0 6.2-1 7.8-3.2 1.6-2.1 2.6-4.7 2.6-7.6.1-2.8-.8-5.4-2.6-7.6m-26 12.4c-.7 1-1.9 1.6-3.4 1.6s-2.7-.6-3.3-1.6c-.7-1.2-1-2.7-1-4.7 0-1.8.3-3.2 1-4.3.7-1.2 1.8-1.8 3.4-1.8 1 0 1.9.3 2.7.9 1.2 1 1.9 3 1.9 5.6-.3 1.8-.5 3.3-1.3 4.3zm6.2-21.8s-5.4-.6-5.4 3.7v5.7c-.6-.9-1.3-1.6-2.4-2.3-.9-.6-2.1-.7-3.3-.7-2.7 0-4.8 1-6.5 3-1.6 1.9-2.4 4.8-2.4 8.4 0 3 .7 5.6 2.4 7.3 1.6 1.9 4.8 2.7 7.6 2.7 9.9 0 9.7-8.4 9.7-8.4zm-26.6 19.3c0 1.8-.6 3-1.5 3.7-1 .6-2.1 1-3.2 1-.7 0-1.3-.1-1.8-.6s-.7-1-.7-1.9c0-1 .4-1.8 1.2-2.3.4-.3 1.3-.6 2.4-.7l1.2-.3c.6-.1 1-.3 1.5-.3.3-.1.7-.3 1-.4zm2.7-11.7c-1.8-.9-3.7-1.3-6-1.3-3.4 0-5.9.9-7.3 2.7-.9 1.2-1.3 2.6-1.5 4.3h5.1c.1-.7.4-1.3.7-1.8.6-.6 1.5-.9 2.7-.9s1.9.1 2.6.4c.6.3.9.9.9 1.8 0 .7-.4 1.2-1.2 1.5-.4.1-1.2.3-2.1.4l-1.8.1c-2.1.3-3.6.7-4.7 1.3-1.9 1-2.9 3-2.9 5.4 0 1.9.6 3.4 1.8 4.5 1.2 1 2.7 1.5 4.6 1.6 11.7.4 11.6-6.2 11.6-7.5v-7.6c.1-2.2-.7-4-2.5-4.9m-26.5 3.3c1.3 0 2.3.4 3 1.2.4.6.7 1.3.7 2.1h5.7c-.3-2.9-1.3-5-3-6-1.6-1.2-3.9-1.6-6.6-1.6-3.2 0-5.7.9-7.5 2.9s-2.7 4.7-2.7 8.1c0 3.2.7 5.6 2.4 7.5 1.6 1.9 4.2 2.9 7.6 2.9s6-1.2 7.8-3.4c1-1.5 1.6-3 1.8-4.7h-5.7c-.1 1-.4 1.9-1 2.6-.6.6-1.5 1-2.9 1-1.8 0-3.2-.9-3.7-2.6-.3-.9-.6-2.1-.6-3.6s.1-2.9.6-3.7c.9-1.8 2.1-2.7 4.1-2.7m-11.9-4.5c-11.9 0-11.1 10.5-11.1 10.5v10.6h5.4v-9.9c0-1.6.1-2.9.6-3.6.7-1.3 2.1-2.1 4.3-2.1h.6c.3 0 .6 0 .9.1v-5.4h-.4c-.1-.2-.1-.2-.3-.2m-26.8 5.5c.7-.7 1.8-1.2 3.2-1.2 1.2 0 2.3.3 3.2 1s1.3 1.8 1.3 3.2h-9.2c.3-1.2.7-2.2 1.5-3zm7.2 9.9c-.1.3-.4.6-.7.7-.7.6-1.8.7-3 .7s-2.1-.1-2.9-.7c-1.3-.7-2.1-2.3-2.1-4.2h14.8c0-1.8 0-3.2-.1-4-.3-1.6-.7-3-1.6-4.2-.9-1.3-2.1-2.4-3.4-3s-3-.9-4.8-.9c-3 0-5.4.9-7.2 2.9-1.8 1.9-2.9 4.6-2.9 8.1 0 3.7 1 6.5 3.2 8.1 2.1 1.6 4.5 2.6 7.2 2.6 3.3 0 5.9-1 7.6-3 1-1 1.6-2.1 1.8-3.2zm-16.2 5.6h-5v-12.3c0-1.2-.3-3.7-3.6-3.7-2.1 0-3.7 1.5-3.7 3.7v12.3h-5v-12.3c0-1.2-.3-3.7-3.6-3.7-2.1 0-3.6 1.5-3.6 3.7v12.3h-5v-12.2c0-5.1 3.3-9 8.5-9 2.6 0 4.7 1 6.2 2.9 1.5-1.8 3.6-2.9 6.2-2.9 5.4 0 8.5 3.7 8.5 9zm93.3-71.2c0-17.1-21.3-31.1-47.6-31.1s-47.6 14-47.6 31.1v1.8c0 18.2 18.6 32.9 47.6 32.9 29.1 0 47.6-14.7 47.6-32.9z" fill="#2d3277" />
    <path d="m1459.8 1427.5c0 16.1-20.5 29.2-45.7 29.2s-45.7-13.1-45.7-29.2 20.5-29.2 45.7-29.2 45.7 13.1 45.7 29.2z" fill="#ffe600" />
    <g fill="#fff">
      <path d="m1398.9 1418.3s-.5.5-.2.9c.7.9 2.9 1.4 5.2.9 1.3-.3 3.1-1.7 4.7-3 1.8-1.4 3.6-2.9 5.4-3.4 1.9-.6 3.1-.3 3.9-.1.9.3 1.9.9 3.6 2.1 3.1 2.3 15.7 13.3 17.9 15.2 1.7-.8 9.5-4.1 20.1-6.5-.9-5.6-4.3-10.8-9.5-15-7.2 3-16.1 4.6-24.8.4 0 0-4.7-2.2-9.4-2.1-6.9.2-9.8 3.1-13 6.3z" />
      <path d="m1438.9 1432.1c-.1-.1-14.8-12.9-18.1-15.4-1.9-1.4-3-1.8-4.1-2-.6-.1-1.4 0-2 .2-1.5.4-3.6 1.8-5.4 3.2-1.9 1.5-3.6 2.9-5.2 3.2-2.1.5-4.6-.1-5.7-.9-.5-.3-.8-.7-1-1.1-.4-1 .4-1.8.5-1.9l4-4.4 1.4-1.4c-1.3.2-2.5.5-3.7.8-1.5.4-2.9.8-4.3.8-.6 0-3.8-.5-4.4-.7-3.7-1-6.9-2-11.7-4.2-5.7 4.3-9.6 9.6-10.7 15.5.8.2 2.2.6 2.7.7 13 2.9 17 5.9 17.8 6.5.8-.9 1.9-1.4 3.2-1.4 1.4 0 2.7.7 3.5 1.8.7-.6 1.8-1.1 3.1-1.1.6 0 1.2.1 1.9.3 1.5.5 2.2 1.5 2.6 2.4.5-.2 1.1-.4 1.8-.4s1.4.2 2.2.5c2.4 1 2.8 3.4 2.6 5.2h.5c2.9 0 5.2 2.3 5.2 5.2 0 .9-.2 1.7-.6 2.4.8.4 2.7 1.4 4.5 1.2 1.4-.2 1.9-.6 2.1-.9.1-.2.3-.4.1-.6l-3.7-4.1s-.6-.6-.4-.8.6.1.9.3c1.9 1.6 4.1 3.9 4.1 3.9s.2.3 1 .5c.7.1 2 0 2.9-.7.2-.2.5-.4.6-.6.9-1.2-.1-2.4-.1-2.4l-4.3-4.8s-.6-.6-.4-.8.6.1.9.3c1.4 1.1 3.3 3.1 5.1 4.9.4.3 2 1.3 4.1-.1 1.3-.9 1.6-1.9 1.5-2.7-.1-1-.9-1.8-.9-1.8l-5.8-5.9s-.6-.5-.4-.8c.2-.2.6.1.9.3 1.9 1.6 6.9 6.2 6.9 6.2.1 0 1.8 1.3 4-.1.8-.5 1.3-1.2 1.3-2.1.1-1.3-1-2.2-1-2.2z" />
      <path d="m1410.6 1439.6c-.9 0-1.9.5-2 .5s0-.4.1-.6 1.3-3.8-1.6-5.1c-2.2-1-3.6.1-4 .6-.1.1-.2.1-.2 0 0-.6-.3-2.4-2.3-3-2.8-.9-4.5 1.1-5 1.8-.2-1.6-1.5-2.8-3.2-2.8-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c.9 0 1.6-.3 2.2-.9v.1c-.1.8-.4 3.7 2.6 4.8 1.2.5 2.2.1 3.1-.5.3-.2.3-.1.3.1-.1.7 0 2.3 2.3 3.2 1.7.7 2.7 0 3.3-.6.3-.3.4-.2.4.2.1 2.1 1.9 3.8 4 3.8 2.2 0 4-1.8 4-4s-1.8-4-4-4z" />
    </g>
    <path d="m1439.5 1430.6c-4.5-3.9-14.9-13-17.8-15.1-1.6-1.2-2.7-1.9-3.7-2.1-.4-.1-1-.3-1.8-.3-.7 0-1.5.1-2.3.4-1.8.6-3.6 2-5.4 3.4l-.1.1c-1.6 1.3-3.3 2.6-4.6 2.9-.6.1-1.1.2-1.7.2-1.4 0-2.7-.4-3.2-1-.1-.1 0-.3.2-.5l4-4.3c3.1-3.1 6-6 12.8-6.2h.3c4.2 0 8.4 1.9 8.9 2.1 4 1.9 8 2.9 12.1 2.9 4.3 0 8.7-1.1 13.3-3.2-.5-.4-1.1-.9-1.6-1.3-4.1 1.8-7.9 2.6-11.7 2.6s-7.6-.9-11.3-2.7c-.2-.1-4.8-2.3-9.7-2.3h-.4c-5.7.1-8.9 2.1-11 3.9-2.1 0-3.9.6-5.5 1-1.4.4-2.7.7-3.9.7h-1.5c-1.4 0-8.4-1.7-13.9-3.9-.6.4-1.1.8-1.7 1.2 5.8 2.4 12.9 4.2 15.1 4.4.6 0 1.3.1 2 .1 1.5 0 2.9-.4 4.4-.8.9-.2 1.8-.5 2.7-.7l-.8.8-4 4.4c-.3.3-1 1.2-.6 2.2.2.4.6.8 1.1 1.2 1 .6 2.7 1.1 4.3 1.1.6 0 1.2-.1 1.7-.2 1.7-.4 3.5-1.8 5.3-3.3 1.5-1.2 3.6-2.7 5.2-3.2.5-.1 1-.2 1.5-.2h.4c1.1.1 2.1.5 4 1.9 3.3 2.5 18 15.3 18.1 15.4 0 0 .9.8.9 2.2 0 .7-.5 1.4-1.2 1.9-.6.4-1.3.6-1.9.6-1 0-1.7-.5-1.7-.5s-5.1-4.6-6.9-6.2c-.3-.3-.6-.5-.9-.5-.2 0-.3.1-.4.2-.3.4 0 .9.4 1.2l5.9 5.9s.7.7.8 1.6c0 1-.4 1.8-1.4 2.4-.7.5-1.4.7-2.1.7-.9 0-1.5-.4-1.7-.5l-.9-.8c-1.5-1.5-3.1-3.1-4.3-4-.3-.2-.6-.5-.9-.5-.1 0-.3 0-.4.2-.1.1-.2.4.1.9.1.2.3.3.3.3l4.3 4.8s.9 1.1.1 2l-.2.2-.4.4c-.7.6-1.7.7-2.1.7h-.6c-.4-.1-.7-.2-.9-.4-.2-.3-2.4-2.4-4.2-3.9-.2-.2-.5-.4-.8-.4-.1 0-.3.1-.4.2-.3.4.2 1 .4 1.2l3.7 4s0 .1-.1.3-.6.6-1.9.8h-.5c-1.4 0-2.8-.7-3.6-1.1.3-.7.5-1.5.5-2.3 0-3-2.4-5.4-5.4-5.4h-.2c.1-1.4-.1-4-2.8-5.1-.8-.3-1.5-.5-2.3-.5-.6 0-1.1.1-1.7.3-.6-1.1-1.5-1.9-2.7-2.3-.7-.2-1.3-.3-2-.3-1.1 0-2.1.3-3 1a4.6 4.6 0 0 0 -3.6-1.7c-1.2 0-2.4.5-3.2 1.3-1.1-.9-5.6-3.7-17.7-6.5-.6-.1-1.9-.5-2.7-.8-.1.6-.2 1.3-.3 2 0 0 2.2.5 2.7.6 12.3 2.7 16.4 5.6 17.1 6.1-.2.6-.3 1.2-.3 1.8 0 2.6 2.1 4.6 4.6 4.6.3 0 .6 0 .9-.1.4 1.9 1.6 3.3 3.5 4 .6.2 1.1.3 1.6.3.3 0 .7 0 1.1-.1.3.9 1.1 2 2.9 2.7.6.3 1.2.4 1.8.4.5 0 1-.1 1.4-.3.8 2 2.8 3.4 5 3.4 1.5 0 2.9-.6 3.9-1.7.9.5 2.7 1.4 4.6 1.4h.7c1.9-.2 2.7-1 3.1-1.5.1-.1.1-.2.2-.3.4.1.9.2 1.5.2 1 0 2-.3 3-1.1 1-.7 1.7-1.7 1.7-2.6.3.1.7.1 1 .1 1 0 2.1-.3 3.1-1 1.9-1.2 2.2-2.9 2.2-3.9.3.1.7.1 1 .1 1 0 2-.3 2.9-.9 1.2-.8 1.9-1.9 2-3.2.1-.9-.2-1.8-.6-2.6 3.2-1.4 10.4-4 19-6 0-.7-.1-1.3-.3-2-10.3 2.2-18 5.5-19.9 6.4zm-28.9 16.7c-2 0-3.6-1.6-3.7-3.6 0-.2 0-.6-.4-.6-.2 0-.3.1-.5.2-.4.4-1 .8-1.8.8-.4 0-.8-.1-1.2-.3-2.1-.9-2.2-2.3-2.1-2.9 0-.2 0-.3-.1-.4l-.1-.1h-.1c-.1 0-.2 0-.4.2-.6.4-1.2.6-1.8.6-.3 0-.7-.1-1-.2-2.8-1.1-2.6-3.7-2.4-4.5 0-.2 0-.3-.1-.4l-.2-.2-.2.2c-.6.5-1.3.8-2 .8-1.6 0-2.9-1.3-2.9-2.9s1.3-2.9 2.9-2.9c1.4 0 2.7 1.1 2.9 2.5l.1.8.4-.7c0-.1 1.2-1.9 3.4-1.8.4 0 .8.1 1.3.2 1.7.5 2 2.1 2 2.7 0 .4.3.4.3.4.1 0 .3-.1.3-.2.3-.3 1-.9 2.1-.9.5 0 1 .1 1.6.4 2.7 1.2 1.5 4.6 1.5 4.7-.2.6-.3.8 0 1h.2c.1 0 .3 0 .5-.1.4-.1.9-.3 1.4-.3 2 0 3.7 1.7 3.7 3.7.1 2.2-1.6 3.8-3.6 3.8z" fill="#2d3277" />
  </svg>
);

// DeepWeb Logo Icon
export const DeepWebLogoIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#1F2937" />
    <circle cx="12" cy="12" r="7" stroke="#DC2626" strokeWidth="1" fill="none" opacity="0.5" />
    <circle cx="12" cy="12" r="4" stroke="#DC2626" strokeWidth="1" fill="none" opacity="0.7" />
    <circle cx="12" cy="12" r="1.5" fill="#DC2626" />
    <path d="M12 2V6" stroke="#DC2626" strokeWidth="0.5" />
    <path d="M12 18V22" stroke="#DC2626" strokeWidth="0.5" />
    <path d="M2 12H6" stroke="#DC2626" strokeWidth="0.5" />
    <path d="M18 12H22" stroke="#DC2626" strokeWidth="0.5" />
  </svg>
);

// Icon component wrapper with standard props
export const AppIcon: React.FC<{
  appId: string;
  size?: number;
  active?: boolean;
  className?: string;
}> = ({ appId, size = 24, active = false, className = '' }) => {
  const icons: Record<string, React.FC<IconProps>> = {
    hubpay: HubPayIcon,
    hubchat: HubChatIcon,
    mdt: MDTIcon,
    amazon: AmazonLogoIcon,
    deepweb: OnionIcon,
    radio: RadioIcon,
    socialhub: SocialHubIcon,
    casino: CasinoIcon,
    browser: BrowserIcon,
    dealer: MotorsIcon,
    marketplace: MarketIcon,
    realestate: PropertiesIcon,
    jobs: JobsIcon,
    business: BusinessIcon,
    settings: SettingsIcon,
    profile: ProfileIcon,
    crypto: CryptoIcon,
    hubcareer: HubCareerIcon,
    archivos: ArchivosIcon,
    hubstore: StoreIcon,
    vps: VPSIcon,
  };

  const IconComponent = icons[appId];

  if (!IconComponent) {
    return <div className={`w-${size/4} h-${size/4} bg-gray-500 rounded`} />;
  }

  return <IconComponent size={size} active={active} className={className} />;
};

// Pocket icon selector
export const PocketIcon: React.FC<{
  iconId: string;
  size?: number;
  className?: string;
}> = ({ iconId, size = 24, className = '' }) => {
  const icons: Record<string, React.FC<IconProps>> = {
    money: PocketMoneyIcon,
    home: PocketHomeIcon,
    car: PocketCarIcon,
    travel: PocketTravelIcon,
    game: PocketGameIcon,
    phone: PocketPhoneIcon,
    work: PocketWorkIcon,
    shield: PocketShieldIcon,
    target: PocketTargetIcon,
    diamond: PocketDiamondIcon,
  };

  const IconComponent = icons[iconId] || PocketMoneyIcon;
  return <IconComponent size={size} className={className} />;
};

// Product icon selector
export const ProductIcon: React.FC<{
  iconId: string;
  size?: number;
  className?: string;
}> = ({ iconId, size = 24, className = '' }) => {
  const icons: Record<string, React.FC<IconProps>> = {
    radio: ProductRadioIcon,
    medical: ProductMedicalIcon,
    vest: ProductVestIcon,
    laptop: ProductLaptopIcon,
    tools: ProductToolsIcon,
    camera: ProductCameraIcon,
    uniform: ProductUniformIcon,
    gps: ProductGPSIcon,
    lockpick: LockpickIcon,
    scanner: ScannerIcon,
    document: DocumentIcon,
    mask: MaskIcon,
    jammer: JammerIcon,
    spray: SprayIcon,
    hacking: HackingIcon,
    fakemoney: FakeMoneyIcon,
  };

  const IconComponent = icons[iconId] || ProductRadioIcon;
  return <IconComponent size={size} className={className} />;
};

export default AppIcon;
