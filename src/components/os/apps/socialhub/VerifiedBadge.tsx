'use client';

import { BadgeCheck, Building2 } from 'lucide-react';

const INSTITUTIONAL_LABEL: Record<string, string> = {
  business: 'Página de empresa',
  organization: 'Página de organización',
  government: 'Página gubernamental',
};

export default function VerifiedBadge({ verified, accountType }: { verified?: boolean; accountType?: string }) {
  if (accountType && INSTITUTIONAL_LABEL[accountType]) {
    return (
      <span title={INSTITUTIONAL_LABEL[accountType]}>
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
