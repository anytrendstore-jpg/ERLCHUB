'use client';

import { BadgeCheck, Building2, Crown, type LucideIcon } from 'lucide-react';

interface Tier {
  icon: LucideIcon;
  gradient: string;
  glow: string;
  label: string;
  shine?: boolean;
}

/** Insignias por tipo de página — cada una con su propio color, para que institución y
 * "cuenta oficial de ERLCHUB" se distingan de un vistazo, no solo por el texto del tooltip. */
const PAGE_TIER: Record<string, Tier> = {
  business: { icon: Building2, gradient: 'from-amber-400 to-orange-500', glow: 'rgba(245,158,11,0.55)', label: 'Página de empresa verificada' },
  organization: { icon: Building2, gradient: 'from-sky-400 to-blue-600', glow: 'rgba(56,189,248,0.55)', label: 'Página de organización verificada' },
  government: { icon: Building2, gradient: 'from-emerald-400 to-teal-600', glow: 'rgba(16,185,129,0.55)', label: 'Página gubernamental verificada' },
  official: { icon: Crown, gradient: 'from-amber-300 via-fuchsia-400 to-violet-600', glow: 'rgba(192,132,252,0.7)', label: 'Cuenta oficial de ERLCᴴᵁᴮ', shine: true },
};

const PERSONAL_TIER: Tier = { icon: BadgeCheck, gradient: 'from-violet-400 to-purple-600', glow: 'rgba(139,92,246,0.55)', label: 'Cuenta verificada' };

const SIZE = { sm: { badge: 'w-4 h-4', icon: 'w-2.5 h-2.5' }, md: { badge: 'w-5 h-5', icon: 'w-3 h-3' } };

export default function VerifiedBadge({ verified, accountType, size = 'sm' }: { verified?: boolean; accountType?: string; size?: 'sm' | 'md' }) {
  const tier = accountType && PAGE_TIER[accountType] ? PAGE_TIER[accountType] : (verified ? PERSONAL_TIER : null);
  if (!tier) return null;

  const Icon = tier.icon;
  const dims = SIZE[size];

  return (
    <span
      title={tier.label}
      className={`relative inline-flex ${dims.badge} rounded-full items-center justify-center bg-gradient-to-br ${tier.gradient} flex-shrink-0 overflow-hidden`}
      style={{ boxShadow: `0 0 6px ${tier.glow}` }}
    >
      <Icon className={`${dims.icon} text-white relative z-[1]`} strokeWidth={3} />
      {tier.shine && <span className="absolute inset-0 animate-lottery-shimmer" />}
    </span>
  );
}
