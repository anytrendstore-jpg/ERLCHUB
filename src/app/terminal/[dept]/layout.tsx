import type { Metadata } from 'next';
import { getDepartment } from '@/lib/departments';

export function generateMetadata({ params }: { params: { dept: string } }): Metadata {
  const department = getDepartment(params.dept);
  if (!department) return { title: 'Terminal no disponible — ERLC HUB' };
  return {
    title: `Terminal ${department.factionAbbreviation} — ERLC HUB`,
    description: `Terminal institucional de ${department.name}.`,
  };
}

export default function DepartmentTerminalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
