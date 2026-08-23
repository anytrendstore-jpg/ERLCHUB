'use client';

import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/os/ui';

/** Estado honesto para pestañas del spec que todavía no tienen datos/backend reales
 * (grupos, páginas, eventos, marketplace, video) — nunca se rellena con contenido inventado. */
export default function ComingSoon({ icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <EmptyState icon={icon} title={title} text={text} />
    </div>
  );
}
