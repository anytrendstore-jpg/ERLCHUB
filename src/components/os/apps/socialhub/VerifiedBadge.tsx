'use client';

import { BadgeCheck, Building2 } from 'lucide-react';

export default function VerifiedBadge({ verified, accountType }: { verified?: boolean; accountType?: string }) {
  if (accountType === 'business' || accountType === 'organization') {
    return (
      <span title={accountType === 'business' ? 'Cuenta de empresa' : 'Cuenta de organización'}>
        <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      </span>
    );
  }
  if (verified) {
    return (
      <span title="Cuenta verificada">
        <BadgeCheck className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
      </span>
    );
  }
  return null;
}
